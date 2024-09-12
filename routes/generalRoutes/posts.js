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


module.exports = app;
