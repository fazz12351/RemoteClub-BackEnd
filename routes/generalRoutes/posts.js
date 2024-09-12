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
            // If no item is found, initialize likes to 1
            const putParams = {
                TableName: 'Likes',
                Item: {
                    postId: postId,
                    likes: 1
                }
            };

            // Insert the new postId with 1 like
            await dynamodb.put(putParams).promise();
            console.log("New postId added with 1 like");

            return res.status(201).json({ message: "Post liked for the first time, likes set to 1" });
        } else {
            // If postId exists, increment the likes count
            const updateParams = {
                TableName: 'Likes',
                Key: {
                    postId: postId
                },
                UpdateExpression: "set #likes = #likes + :increment",
                ExpressionAttributeNames: {
                    '#likes': 'likes'  // Use ExpressionAttributeNames to avoid reserved keywords
                },
                ExpressionAttributeValues: {
                    ':increment': 1
                },
                ReturnValues: 'UPDATED_NEW'  // Return the updated attributes
            };

            const updatedData = await dynamodb.update(updateParams).promise();
            console.log("Likes incremented:", updatedData);

            return res.status(200).json({ message: "Post liked", updatedLikes: updatedData.Attributes.likes });
        }
    }
    catch (err) {
        console.error("Error:", err);
        return res.status(400).json({ Error: err.message });
    }
});

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

app.delete("/likes/:postId", verifyToken, async (req, res) => {
    try {
        const postId = req.params.postId;

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

        if (!data.Item) {
            // If no likes exist for the postId, return a message indicating no likes to decrement
            return res.status(404).json({ message: "No likes exist for this post to decrement" });
        } else {
            const currentLikes = data.Item.likes;

            if (currentLikes > 0) {
                // If postId exists and likes are greater than 0, decrement the likes count
                const updateParams = {
                    TableName: 'Likes',
                    Key: {
                        postId: postId
                    },
                    UpdateExpression: "set #likes = #likes - :decrement",
                    ExpressionAttributeNames: {
                        '#likes': 'likes'  // Use ExpressionAttributeNames to avoid reserved keywords
                    },
                    ExpressionAttributeValues: {
                        ':decrement': 1
                    },
                    ReturnValues: 'UPDATED_NEW'  // Return the updated attributes
                };

                const updatedData = await dynamodb.update(updateParams).promise();
                console.log("Likes decremented:", updatedData);

                return res.status(200).json({ message: "Post like decremented", updatedLikes: updatedData.Attributes.likes });
            } else {
                // If likes are already 0, return a message
                return res.status(400).json({ message: "Likes cannot be less than 0" });
            }
        }
    }
    catch (err) {
        console.error("Error:", err);
        return res.status(500).json({ Error: err.message });
    }
});



module.exports = app;
