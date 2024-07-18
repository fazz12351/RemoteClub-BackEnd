const bodyParser = require("body-parser");
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const {
    verifyToken
} = require("../../Functions/middleware/authorisation");

const {
    BookingModel,
    EmployeeModel
} = require("../../Functions/databaseSchema");
const sendMessage = require("../../Functions/Twilio");

app.use(bodyParser.urlencoded({
    extended: true
}));

app.get("/openJobs", verifyToken, async (req, res) => {
    try {
        const availableJobs = await BookingModel.find({});
        res.status(200).json({
            response: availableJobs
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: "Internal Server Error"
        });
    }
});

app.post("/openJob/:job_id", verifyToken, async (req, res) => {
    try {
        console.log(req.user)
        const tradesmanId = req.user.id;
        const jobId = req.params.job_id;

        // Check if jobId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(jobId)) {
            return res.status(400).json({ response: "Invalid Job ID format" });
        }

        // Find the job by its ID
        const currentJob = await BookingModel.findById(jobId);
        if (!currentJob) {
            return res.status(404).json({ response: "Job doesn't exist" });
        }

        // Update the tradesman's booking
        const updatedTradesman = await EmployeeModel.findByIdAndUpdate(
            tradesmanId,
            { $push: { booking: currentJob } },
            { new: true } // Return the updated document
        );

        if (!updatedTradesman) {
            return res.status(404).json({ response: "Tradesman not found" });
        }
        sendMessage(req.user.telephone, "TradesmansWorld: Job Booked Succesfully")
        await BookingModel.deleteOne({ _id: jobId })
        return res.status(200).json({ response: "Job added to Booking" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

app.delete("/openJob/:job_id", verifyToken, async (req, res) => {
    try {
        const tradesmanId = req.user.id // Assuming this is a valid Tradesman ID
        const jobId = req.params.job_id;

        // Check if jobId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(jobId)) {
            return res.status(400).json({ response: "Invalid Job ID format" });
        }

        // Find the tradesman by ID
        let tradesman = await EmployeeModel.findById(tradesmanId);

        // Check if the tradesman exists
        if (!tradesman) {
            return res.status(404).json({ response: "Tradesman not found" });
        }
        let bookings = tradesman.booking
        let bookingInfo = null
        for (let i = 0; i < bookings.length; i++) {
            if (bookings[i]._id == jobId) {
                bookingInfo = bookings[i]
                bookings.splice(i, 1)

            }
        }
        if (bookingInfo == null) {
            return res.status(404).json({ response: "Job was not found with this tradesmans" });
        }


        // Update the tradesman document with the modified bookings array
        await EmployeeModel.findByIdAndUpdate(tradesmanId, { booking: bookings }).then(() => {
            const { firstname, lastname, telephone, address, jobtitle, jobdescription } = bookingInfo
            const newBooking = new BookingModel({
                firstname: firstname,
                lastname: lastname,
                telephone: telephone,
                address: address,
                jobtitle: jobtitle,
                jobdescription: jobdescription
            })
            newBooking.save()
            sendMessage(req.user.telephone, "TradesmansWorld: Job has been removed succesfully")
            return res.status(200).json({ response: "Job removed from tradesman booking and added back to openJobs" });

        })
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});






module.exports = app;
