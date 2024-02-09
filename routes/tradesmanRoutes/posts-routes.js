const express = require("express");
const app = express();
const mongodb = require("mongodb");
const mongoose = require("mongoose");
const { hashPassword, registerEmployee, EmployeeModel, comparePasswords, PostsModel } = require("../../Functions/databaseSchema");
const { verifyToken } = require("../../Functions/middleware/authorisation")

// This middleware is necessary to parse the request body in JSON format
app.use(express.json());




//endpoint used to add new posts to the logged in user. 
app.post("/post", verifyToken, async (req, res) => {
    try {
        const { title, createdAt, videoName } = req.body;
        if (title.length < 1 || createdAt.length < 1 || videoName.length < 1) {
            return res.status(200).json({ responce: "Ensure to add title, video and the date created" })
        }
        TradesmanId = req.user.id

        const exists = await EmployeeModel.findById(TradesmanId)

        if (exists) {
            await EmployeeModel.updateOne({ "_id": TradesmanId }, {
                $push: {
                    posts: {
                        title,
                        createdAt,
                        videoName,
                        TradesmanId
                    }
                }
            },
                { new: true }) // Return the updated document)
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