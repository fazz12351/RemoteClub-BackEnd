const express = require("express");
const app = express();
const mongodb = require("mongodb");
const mongoose = require("mongoose");
const {
    hashPassword,
    registerEmployee,
    EmployeeModel,
    comparePasswords,
    PostsModel
} = require("../../Functions/databaseSchema");

// This middleware is necessary to parse the request body in JSON format
app.use(express.json());


app.post("/post/:TradesmanId", async (req, res) => {
    try {
        const {
            title,
            createdAt,
            videoName
        } = req.body;
        TradesmanId = req.params.TradesmanId
        const exists = await EmployeeModel.findById(TradesmanId)
        if (exists) {
            await EmployeeModel.updateOne({
                "_id": TradesmanId
            }, {
                $push: {
                    posts: {
                        title,
                        createdAt,
                        videoName,
                        TradesmanId
                    }
                }
            }, {
                new: true
            }) // Return the updated document)

            res.status(200).json({
                responce: "Succesfully posted"
            })

        } else {
            res.status(200).json({
                responce: "Tradesmans id couldnt be found"
            })
        }

    } catch (err) {
        res.status(500).json({
            responce: "Internal Server Error"
        })
    }

})


module.exports = app;