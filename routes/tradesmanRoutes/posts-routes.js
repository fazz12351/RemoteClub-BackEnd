const express = require("express");
const app = express();
const mongodb = require("mongodb");
const mongoose = require("mongoose");
const { hashPassword, registerEmployee, EmployeeModel, comparePasswords, PostsModel } = require("../../Functions/databaseSchema");
const { verifyToken } = require("../../Functions/middleware/authorisation")
const multer = require("multer")
const upload = multer()
// This middleware is necessary to parse the request body in JSON format
app.use(express.json());




//endpoint used to add new posts to the logged in user. 
app.post("/upload", upload.any(), async (req, res) => {
    try {
        const { title } = req.body;
        let videoName = null
        let date = new Date()
        let createdAt = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} @ ${date.getDate()}/${date.getMonth()}/${date.getFullYear()} `
        if (title.length < 1 || createdAt.length < 1) {
            return res.status(200).json({ responce: "Ensure to add title, video and the date created" })
        }
        if (req.files.length > 0) {
            videoName = req.files[0].originalname
        }

        // TradesmanId = req.user.id
        TradesmanId = "663804edd56b0934e8910d63"

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