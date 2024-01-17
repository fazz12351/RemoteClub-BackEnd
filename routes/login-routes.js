const express = require("express");
const app = express();
const mongodb = require("mongodb");
const mongoose = require("mongoose");
const registerTradesman = require("../Functions/general_functions");
const { hashPassword, registerEmployee, EmployeeModel, comparePasswords } = require("../Functions/general_functions");

// This middleware is necessary to parse the request body in JSON format
app.use(express.json());

app.get("/test", async (req, res) => {
    console.log("working");
    res.send("Test endpoint is working!");
});

app.post("/register_Tradesman", async (req, res) => {
    try {
        let { firstname, lastname, password, email } = req.body;

        if (firstname && lastname && password && email) {
            const userExists = await EmployeeModel.exists({ email });

            if (!userExists) {
                const hashedPassword = await hashPassword(password);
                await registerEmployee(firstname, lastname, hashedPassword, email);
                return res.status(200).json({ response: "User successfully added" });
            } else {
                return res.status(409).json({ response: "User already exists with that email" });
            }
        } else {
            return res.status(400).json({ response: "Not all fields were valid" });
        }
    } catch (err) {
        console.error("Error:", err);
        return res.status(500).json({ response: "Internal Server Error" });
    }
});

app.post("/login_Tradesman", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (email && password) {
            const user = await EmployeeModel.findOne({ email });

            if (user) {
                const isPasswordValid = await comparePasswords(password, user.password);

                if (isPasswordValid) {
                    return res.status(200).json({ response: "User successfully logged in" });
                } else {
                    return res.status(401).json({ response: "User password is incorrect" });
                }
            } else {
                return res.status(404).json({ response: "Email or password does not exist" });
            }
        } else {
            return res.status(400).json({ response: "Please enter all fields" });
        }
    } catch (err) {
        console.error("Error:", err);
        return res.status(500).json({ response: "Internal Server Error" });
    }
});

app.post("/Online/:isOnline", async (req, res) => {
    try {
        const { email } = req.body;
        const isOnline = parseInt(req.params.isOnline);

        if (isNaN(isOnline) || (isOnline !== 0 && isOnline !== 1)) {
            return res.status(400).json({ Error: "Param value should be either 0 or 1" });
        }

        const filter = { email };
        const updateOperation = { $set: { available: isOnline === 1 } };

        await EmployeeModel.updateOne(filter, updateOperation);

        const responseMessage = isOnline === 1 ? "User successfully online" : "User successfully offline";

        res.status(200).json({ response: responseMessage });
    } catch (err) {
        console.error(err);
        res.status(500).json({ Error: "Internal Server Error" });
    }
});



module.exports = app;
