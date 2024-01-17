const express = require("express");
const app = express();
const mongodb = require("mongodb");
const mongoose = require("mongoose");
const registerTradesman = require("../Functions/general_functions");
const { hashPassword, registerEmployee, EmployeeModel, comparePasswords } = require("../Functions/general_functions");
const { BookingModel } = require("../Functions/databaseSchema");


const { ObjectId } = require('mongoose').Types;

app.post("/bookJob/:tradesmanEmail", async (req, res) => {
    try {
        const tradesmansEmail = req.params.tradesmanEmail;
        const { firstname, lastname, telephone, address, jobtitle, jobdescription } = req.body;

        // Use findOneAndUpdate to find the tradesman by email and push a new job to the booking array
        const updatedTradesman = await EmployeeModel.findOneAndUpdate(
            { email: tradesmansEmail },
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
            return res.status(200).json({ response: "Job booked successfully", tradesman: updatedTradesman });
        } else {
            return res.status(404).json({ response: "Tradesman not found" });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ response: "Internal Server Error" });
    }
});

app.post("/bookJob", async (req, res) => {
    try {
        const { firstname, lastname, telephone, address, jobtitle, jobdescription } = req.body;
        const newBooking = await new BookingModel({
            firstname: firstname,
            lastname: lastname,
            telephone: telephone,
            address: address,
            jobtitle: jobtitle,
            jobdescription: jobdescription
        })
        await newBooking.save()
        return res.status(200).json({ responce: `Job has been posted succesfully for a ${jobtitle} service ` })
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ response: "Internal Server Error" });
    }
});



module.exports = app;

