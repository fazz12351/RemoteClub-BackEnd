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


app.post("/post/:TradesmanEmail", async (req, res) => {
    try {
        const {
            title,
            createdAt,
            videoName
        } = req.body;
        const tradesmanEmail = req.params.TradesmanEmail;
        const exists = await EmployeeModel.find({
            "email": `${tradesmanEmail}`
        })
        if (exists.length > 0) {
            await EmployeeModel.updateOne({
                "email": tradesmanEmail
            }, {
                $push: {
                    posts: {
                        title,
                        createdAt,
                        videoName,
                        tradesmanEmail
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
                responce: "Tradesmans email couldnt be found"
            })
        }

    } catch (err) {
        res.status(500).json({
            responce: "Internal Server Error"
        })
    }

})


module.exports = app;