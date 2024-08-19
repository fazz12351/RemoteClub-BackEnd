const express = require("express")
const { verifyToken } = require("../../Functions/middleware/authorisation")
const { EmployeeModel } = require("../../Functions/databaseSchema")
const Multer = require("multer")
const { s3Upload, s3Retrieve } = require("../../Functions/general_functions")
const mongoose = require("mongoose")
const multer = require("multer");
const upload = multer();
const app = express()



app.get("/profile", verifyToken, async (req, res) => {
    try {
        const profileInfo = await EmployeeModel.findOne({ _id: req.user.id })
        const { firstname, lastname, email, posts, booking } = profileInfo
        let profile_picture = null;
        if (profileInfo.profile_picture != null) {
            profile_picture = await s3Retrieve(profileInfo.profile_picture)
        }
        return res.status(200).json({ responce: { firstname: firstname, lastname: lastname, email: email, posts: posts, bookings: booking, profile_picture: profile_picture } })
    }
    catch (err) {
        console.log(err)
        return res.status(500).json({ responce: "Internal server error" })
    }
})

app.put("/profile_picture", upload.any(), async (req, res) => {
    try {

        const date = new Date();
        const createdAt = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} @ ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
        const time = createdAt.split(" ")[0]

        const TradesmanId = req.user.id
        const exists = await EmployeeModel.findById(TradesmanId);

        if (!exists) {
            return res.status(404).json({ response: "Tradesman's id could not be found" });
        }

        // Assuming you want to upload the first file in the req.files array
        if (req.files.length === 0) {
            return res.status(400).json({ response: "No files uploaded" });
        }
        console.log(req.files)
        const session = await mongoose.startSession()

        try {
            session.startTransaction();
            const updatedEmployee = await EmployeeModel.findOneAndUpdate(
                { _id: TradesmanId },       // Query to find the employee by ID
                { $set: { profile_picture: `${TradesmanId}@${time}${req.files[0].originalname}` } },  // Update the email field
                { new: true }             // Return the updated document
            );
            await s3Upload(req.files[0], time, TradesmanId);
            await session.commitTransaction();
        }
        catch (err) {
            await session.abortTransaction();
            console.log(err)
            return res.status(400).json({ "Error": err })
        }
        finally {
            session.endSession();

        }

        res.status(200).json({ response: "Successfully posted" });

    }
    catch (err) {
        console.log(err)
        return res.status(400).json({ "Error": err })
    }
})


module.exports = app;