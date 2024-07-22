const express = require("express");
const app = express();
const mongoose = require("mongoose");
const { EmployeeModel, PostsModel } = require("../../Functions/databaseSchema");
const multer = require("multer");
const upload = multer();
const { generateToken, verifyToken } = require("../../Functions/middleware/authorisation");
const { s3Retrieve, s3Upload, s3Delete, getCoordinates } = require("../../Functions/general_functions")
const { SupportApp } = require("aws-sdk");

app.get("/:videoName", async (req, res) => {
    try {
        let videName = req.params.videoName
        videName = await s3Retrieve(videName)

        return res.status(200).json({ data: videName })

    } catch (err) {
        console.log(err)
        return res.status(400).json({ Error: err })
    }
})


module.exports = app;