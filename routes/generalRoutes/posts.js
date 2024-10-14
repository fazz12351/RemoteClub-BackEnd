const express = require("express");
const app = express();
const mongoose = require("mongoose");
const { EmployeeModel, PostsModel } = require("../../Functions/databaseSchema");
const multer = require("multer");
const upload = multer();
const { generateToken, verifyToken } = require("../../Functions/middleware/authorisation");
const { s3Retrieve, s3Upload, s3Delete, getCoordinates } = require("../../Functions/general_functions");
const { SupportApp } = require("aws-sdk");
const { dynamodb } = require("../../Functions/configuration")

// Pagination in allPosts endpoint
app.get("/allposts", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        // Extract page and limit from query params or set defaults
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // Calculate how many documents to skip
        const skip = (page - 1) * limit;

        // Fetch total count of posts
        const totalPosts = await PostsModel.countDocuments();

        // Fetch paginated posts
        let allPosts = await PostsModel.find({})
            .skip(skip) // Skip the appropriate number of posts
            .limit(limit); // Limit the results

        // Loop through posts to retrieve video URLs from S3
        for (let i = 0; i < allPosts.length; i++) {
            let currentPostLike = false;
            const postObject = allPosts[i].toObject(); // Convert Mongoose document to plain object
            postObject.videoName = await s3Retrieve(postObject.videoName); // Retrieve the video URL from S3
            // Prepare DynamoDB query to fetch likes
            const params = {
                TableName: "Likes",
                Key: {
                    postId: allPosts[i].id
                }
            };
            // Attempt to retrieve likes for the post from DynamoDB
            const data = await dynamodb.get(params).promise();
            postObject.likes = data && data.Item ? data.Item.likes : 0; // Default to 0 if no data is found
            if (data.Item) {
                const users = new Set(data.Item.users)
                if (users.has(userId)) {
                    currentPostLike = true;
                }
            }
            postObject.liked = currentPostLike
            allPosts[i] = postObject; // Replace the original Mongoose document with the updated object
        }

        // Calculate total number of pages
        const totalPages = Math.ceil(totalPosts / limit);

        // Return paginated results along with pagination info
        return res.status(200).json({
            data: allPosts,
            currentPage: page,
            totalPages: totalPages,
            totalPosts: totalPosts,
            hasMore: page < totalPages // Indicate if there's more data
        });

    } catch (err) {
        return res.status(400).json({ "Error": err });
    }
});

app.post("/like/:postId", verifyToken, async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.user.id;


        // Check if the postId exists in your primary Posts collection (e.g., MongoDB)
        const postExists = await PostsModel.find({ _id: postId });
        if (postExists.length < 1) {
            return res.status(204).json({ "Error": "No matching postId exists" });
        }

        // Parameters for DynamoDB get request
        const params = {
            TableName: 'Likes',
            Key: {
                postId: postId // Use the dynamic postId as the primary key
            }
        };

        // Check if postId exists in DynamoDB Likes table
        const data = await dynamodb.get(params).promise();

        if (!data.Item) {
            // If no item is found, initialize likes to 1 and add the user to the set
            const putParams = {
                TableName: 'Likes',
                Item: {
                    postId: postId,
                    likes: 1,
                    users: [userId] // Initialize users array with the current user
                }
            };

            // Insert the new postId with 1 like
            await dynamodb.put(putParams).promise();
            return res.status(201).json({ message: "Post liked for the first time, likes set to 1" });
        }
        // Check if the user has already liked the post
        if (data.Item.users.includes(userId)) {
            return res.status(400).json({ message: "User has already liked this post" });
        }

        // If postId exists, increment the likes count and add the user to the users array
        const updateParams = {
            TableName: 'Likes',
            Key: {
                postId: postId,
            },
            UpdateExpression: "set #likes = #likes + :increment, #users = list_append(if_not_exists(#users, :empty_list), :new_user)",
            ExpressionAttributeNames: {
                '#likes': 'likes',  // Use ExpressionAttributeNames to avoid reserved keywords
                '#users': 'users'
            },
            ExpressionAttributeValues: {
                ':increment': 1,
                ':empty_list': [],
                ':new_user': [userId]  // Add the new user to the list of users
            },
            ReturnValues: 'UPDATED_NEW'  // Return the updated attributes
        };

        const updatedData = await dynamodb.update(updateParams).promise();
        return res.status(200).json({ message: "Post liked", updatedLikes: updatedData.Attributes.likes });
    }
    catch (err) {
        return res.status(400).json({ Error: err.message });
    }
});

//Endpoint used to return total number of likes for a given post
app.get("/likes/:postId", verifyToken, async (req, res) => {
    try {
        const postId = req.params.postId;

        // Check if the postId exists in your primary Posts collection (e.g., MongoDB)
        const postExists = await PostsModel.findOne({ _id: postId });
        if (!postExists) {
            return res.status(404).json({ message: "No matching post exists" });
        }

        // Prepare DynamoDB query to fetch likes
        const params = {
            TableName: "Likes",
            Key: {
                postId: postId
            }
        };

        // Attempt to retrieve likes for the post from DynamoDB
        const data = await dynamodb.get(params).promise();

        if (data.Item && typeof data.Item.likes !== 'undefined') {
            return res.status(200).json({ likes: data.Item.likes });
        } else {
            return res.status(200).json({ likes: 0 });  // No likes found, return 0
        }

    } catch (err) {
        console.error("Error fetching likes:", err);
        return res.status(500).json({ error: "An error occurred while retrieving likes" });
    }
});

//Endpoint used to remove likes for a given post
app.delete("/likes/:postId", verifyToken, async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.user.id;

        // Check if the postId exists in your primary Posts collection (e.g., MongoDB)
        const postExists = await PostsModel.find({ _id: postId });
        if (postExists.length < 1) {
            return res.status(404).json({ "Error": "No matching postId exists" });
        }

        // Parameters for DynamoDB get request
        const params = {
            TableName: 'Likes',
            Key: {
                postId: postId // Use the dynamic postId as the primary key
            }
        };

        // Check if postId exists in DynamoDB Likes table
        const data = await dynamodb.get(params).promise();

        //if the data doesnt have a key called Item, the likes doesnt exist
        if (!data.Item) {
            return res.status(404).json({ message: "No likes exist for this post to decrement" });
        } else {
            const usersSet = new Set(data.Item.users); // Convert array to Set for faster lookup
            if (!usersSet.has(userId)) {
                return res.status(404).json({ message: "Current User has no likes attached to this post" });
            }
            // Remove the user from the Set
            usersSet.delete(userId);
            const updatedUsersArray = Array.from(usersSet);  // Convert back to array for storage

            // Prepare the DynamoDB update params
            const updateParams = {
                TableName: 'Likes',
                Key: {
                    postId: postId
                },
                UpdateExpression: "set #users = :updatedUsers, #likes = :updatedLikes",
                ExpressionAttributeNames: {
                    '#users': 'users',
                    '#likes': 'likes'
                },
                ExpressionAttributeValues: {
                    ':updatedUsers': updatedUsersArray,
                    ':updatedLikes': updatedUsersArray.length // Set likes to the length of updatedUsersArray
                },
                ReturnValues: 'UPDATED_NEW'
            };

            // Execute the update operation
            const updatedData = await dynamodb.update(updateParams).promise();

            return res.status(200).json({
                message: "User like removed and post likes updated",
                updatedLikes: updatedData.Attributes.likes // Returning the updated likes count
            });
        }
    } catch (err) {
        console.error("Error:", err);
        return res.status(500).json({ Error: err.message });
    }
});



module.exports = app;
