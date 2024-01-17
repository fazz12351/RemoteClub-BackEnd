const express = require("express");
const app = express();
const mongodb = require("mongodb");
const mongoose = require("mongoose");
const registerTradesman = require("../generalFunctions/dbfunctions");
const { hashPassword, registerEmployee, EmployeeModel } = require("../generalFunctions/dbfunctions");

// This middleware is necessary to parse the request body in JSON format
app.use(express.json());

app.get("/test", async (req, res) => {
    console.log("working");
    res.send("Test endpoint is working!");
});

app.post("/registerTradesman", async (req, res) => {
    try {
        let { firstname, lastname, password, email } = req.body; // Use let instead of const for reassignment

        if (firstname && lastname && password && email) {
            const exists = await EmployeeModel.find({ "email": email })
            if (exists.length == 0) {
                const hashedPassword = await hashPassword(password)
                await registerEmployee(firstname, lastname, hashedPassword, email)
                return res.status(200).json({ responce: "User succesfully added" })

            }
            else {
                return res.status(400).json({ responce: "User already exist in the database with that email" })
            }
        } else {
            res.status(400).json({ response: "Not all fields were valid" }); // Change status to 400 for Bad Request
        }
    } catch (err) {
        console.error("Error:", err); // Log the error
        res.status(500).json({ response: "Internal Server Error" }); // Send a generic error response
    }
});


module.exports = app;
