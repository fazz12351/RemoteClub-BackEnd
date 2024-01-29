const express = require("express");
const app = express();
const mongodb = require("mongodb");
const mongoose = require("mongoose");
const registerTradesman = require("../../Functions/general_functions");
const { hashPassword, registerEmployee, EmployeeModel, comparePasswords } = require("../../Functions/general_functions");
const { BookingModel } = require("../../Functions/databaseSchema");
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: true }))


const { ObjectId } = require('mongoose').Types;

app.post("/bookJob/:tradesmanId", async (req, res) => {
    try {
        const tradesmansId = req.params.tradesmanId;
        const { firstname, lastname, telephone, address, jobtitle, jobdescription } = req.body;

        const tradesmansName = await EmployeeModel.findById({ "_id": tradesmansId })


        // Use findOneAndUpdate to find the tradesman by email and push a new job to the booking array
        const updatedTradesman = await EmployeeModel.findByIdAndUpdate(
            tradesmansId,
            {
                $push: {
                    booking: {
                        firstname,
                        lastname,
                        telephone,
                        address,
                        jobtitle,
                        jobdescription,
                    }
                }
            },
            { new: true } // Return the updated document
        );

        if (updatedTradesman) {
            return res.status(200).json({
                response: `Job booked successfully with ${tradesmansName.firstname + " " + tradesmansName.lastname}`, jobDescription: req.body
            });
        } else {
            return res.status(404).json({ response: "Tradesman not found" });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ response: "Internal Server Error" });
    }
});


app.post("/postJob", async (req, res) => {
    try {
        const { firstname, lastname, telephone, address, jobtitle, jobdescription } = req.body;

        // Create a new booking instance. //Add picttueres for video facility.
        const newBooking = new BookingModel({
            firstname,
            lastname,
            telephone,
            address,
            jobtitle,
            jobdescription,
        });

        // Save the new booking to the database
        await newBooking.save();

        // Respond with a success message
        return res.status(200).json({
            response: `Job has been posted successfully for a ${jobtitle} service`,
            bookingInformation: newBooking,
        });
    } catch (error) {
        console.error(error);
        // Handle validation errors
        if (error.name === "ValidationError") {
            return res.status(400).json({ response: "Validation Error", errors: error.errors });
        }
        // Handle other errors
        res.status(500).json({ response: "Internal Server Error" });
    }
});



module.exports = app;



