const express = require("express")
const app = express()
const { dynamodb } = require("../../Functions/configuration")
const { PostsModel } = require("../../Functions/databaseSchema");
const { verifyToken } = require("../../Functions/middleware/authorisation");


app.post("/:postId", verifyToken, async (req, res) => {
    const postId = req.params.postId;
    const userId = req.user.id;
    const { comment } = req.body;
    try {

        if (!comment) {
            return res.status(204).json({ Error: "No comments were added, make sure to add comment in key-value pair JSON {comment:``}" })
        }
        // Check if the post exists
        const postExists = await PostsModel.findOne({ _id: postId });
        if (!postExists) {
            return res.status(204).json({ Error: "Post doesn't exist with that ID" });
        }
        //query params to check if the post id exist already in Dynamodb.
        const getParams = {
            TableName: 'Comments',
            Key: {
                postid: postId,
            }
        };

        // Retrieve existing comments for the post
        const data = await dynamodb.get(getParams).promise();

        if (!data.Item) {
            // If no comments exist, initialize the comments array with the first comment
            const putParams = {
                TableName: 'Comments',
                Item: {
                    postid: postId,
                    comments: [{ userId: userId, comment: comment }]
                }
            };

            await dynamodb.put(putParams).promise();
            return res.status(200).json({ response: "First comment added" });
        } else {
            // If comments already exist, append the new comment
            const existingComments = data.Item.comments;
            existingComments.push({ userId: userId, comment: comment });

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
            return res.status(200).json({ response: "Comment added successfully" });
        }

    } catch (err) {
        return res.status(400).json({ Error: err.message });
    }
});


app.get("/:postId", verifyToken, async (req, res) => {
    try {
        const postId = req.params.postId
        const getParams = {
            TableName: 'Comments',
            Key: {
                postid: postId,
            }
        };

        // Retrieve existing comments for the post
        let data = await dynamodb.get(getParams).promise();
        data = data.Item
        return res.status(200).json({ data })

    }
    catch (err) {

    }
})



module.exports = app