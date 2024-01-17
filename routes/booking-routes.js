const express = require("express");
const app = express();
const mongodb = require("mongodb");
const mongoose = require("mongoose");
const registerTradesman = require("../generalFunctions/dbfunctions");
const { hashPassword, registerEmployee, EmployeeModel, comparePasswords } = require("../generalFunctions/dbfunctions");


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


module.exports = app;

