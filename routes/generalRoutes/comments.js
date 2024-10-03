const express = require("express")
const app = express()
const { dynamodb } = require("../../Functions/configuration")
const { PostsModel, EmployeeModel, CustomerModel } = require("../../Functions/databaseSchema");
const { verifyToken } = require("../../Functions/middleware/authorisation");


const { v4: uuidv4 } = require('uuid'); // Import UUID library for generating unique IDs
const { verify } = require("jsonwebtoken");

//endpoint used to create a new comment for a specific post
app.post("/:postId", verifyToken, async (req, res) => {
    const postId = req.params.postId;
    const userId = req.user.id;
    const { comment } = req.body;

    try {
        if (!comment) {
            return res.status(204).json({ Error: "No comments were added, make sure to add a comment in key-value pair JSON {comment:``}" });
        }

        // Check if the post exists
        const postExists = await PostsModel.findOne({ _id: postId });
        if (!postExists) {
            return res.status(404).json({ Error: "Post doesn't exist with that ID" });
        }

        // Generate a unique commentId for the new comment
        const commentId = uuidv4();

        // Query to check if the post id exists already in DynamoDB.
        const getParams = {
            TableName: 'Comments',
            Key: { postid: postId }
        };

        const data = await dynamodb.get(getParams).promise();

        if (!data.Item) {
            // If no comments exist, initialize the comments map with the first comment
            const putParams = {
                TableName: 'Comments',
                Item: {
                    postid: postId,
                    comments: {
                        [commentId]: { userId: userId, comment: comment, createdAt: new Date().toISOString() }
                    }
                }
            };

            await dynamodb.put(putParams).promise();
            return res.status(200).json({ response: "First comment added", commentId });
        } else {
            // If comments already exist, add the new comment to the map
            const existingComments = data.Item.comments;

            // Add the new comment with its unique commentId
            existingComments[commentId] = { userId: userId, comment: comment, createdAt: new Date().toISOString() };

            const updateParams = {
                TableName: 'Comments',
                Key: { postid: postId },
                UpdateExpression: "set comments = :c",
                ExpressionAttributeValues: {
                    ":c": existingComments
                },
                ReturnValues: "UPDATED_NEW"
            };

            await dynamodb.update(updateParams).promise();
            return res.status(200).json({ response: "Comment added successfully", commentId });
        }

    } catch (err) {
        return res.status(400).json({ Error: err.message });
    }
});


// Endpoint to retrieve all comments for a specific postId
app.get("/:postId", verifyToken, async (req, res) => {
    try {
        const postId = req.params.postId;
        console.log(`Fetching comments for postId: ${postId}`);

        // DynamoDB parameters to retrieve comments for the post
        const getParams = {
            TableName: 'Comments',
            Key: { postid: postId },
        };

        // Retrieve existing comments for the post
        const data = await dynamodb.get(getParams).promise();

        // Check if there are any comments
        if (!data.Item || !data.Item.comments) {
            return res.status(404).json({ message: 'No comments found for this post.' });
        }

        const comments = data.Item.comments;
        const responseData = [];

        // Get the unique comment keys
        const uniqueKeys = Object.keys(comments);

        // Fetch authors and build the response data in parallel
        await Promise.all(uniqueKeys.map(async (key) => {
            const comment = comments[key];
            // Try to find the author in either EmployeeModel or CustomerModel
            const author = await EmployeeModel.findOne({ _id: comment.userId }) ||
                await CustomerModel.findOne({ _id: comment.userId });

            // Add author's details to the comment
            if (author) {
                comment.firstname = author.firstname;
                comment.surname = author.surname;
            } else {
                comment.firstname = "Unknown";
                comment.surname = "User";
            }
            responseData.push(comment);
        }));

        // Return the comments with author details
        return res.status(200).json({ comments: responseData });
    } catch (err) {
        console.error('Error fetching comments:', err);
        return res.status(500).json({ message: 'An error occurred while retrieving comments.' });
    }
});




module.exports = app