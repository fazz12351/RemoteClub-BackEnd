const express = require("express");
const app = express();
const mongoose = require("mongoose");
const { EmployeeModel, PostsModel } = require("../../Functions/databaseSchema");
const multer = require("multer");
const upload = multer();
const { generateToken, verifyToken } = require("../../Functions/middleware/authorisation");
const { s3Retrieve, s3Upload, s3Delete, getCoordinates } = require("../../Functions/general_functions")
const { SupportApp } = require("aws-sdk");


app.get("/allposts", verifyToken, async (req, res) => {
    try {
        let allPosts = await PostsModel.find({})
        for (let i = 0; i < allPosts.length; i++) {
            allPosts[i].videoName = await s3Retrieve(allPosts[i].videoName)
        }
        return res.status(200).json({ data: allPosts })

    } catch (err) {
        return res.status(400).json({ "Error": err })
    }
})

module.exports = app