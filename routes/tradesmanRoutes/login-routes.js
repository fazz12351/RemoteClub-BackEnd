const express = require("express");
const app = express();
const mongodb = require("mongodb");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken")
const registerTradesman = require("../../Functions/general_functions");
const { hashPassword, registerEmployee, EmployeeModel, comparePasswords } = require("../../Functions/general_functions");
const { generateToken, verifyToken } = require("../../Functions/authorisation");

// This middleware is necessary to parse the request body in JSON format
app.use(express.json());

app.get("/test", verifyToken, async (req, res) => {
    const userIdFromToken = req.user.firstname
    console.log(userIdFromToken)

});

// Endpoint that requires a valid token
app.get('/protected', verifyToken, (req, res) => {
    // The verifyToken middleware has already decoded the token and set req.user
    const userIdFromToken = req.user.email;
    res.json({ message: `Protected endpoint accessed by user: ${userIdFromToken}` });
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

        if (!email || !password) {
            return res.status(400).json({ response: "Please provide both email and password" });
        }

        const user = await EmployeeModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ response: "Email or password does not exist" });
        }

        const isPasswordValid = await comparePasswords(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ response: "User password is incorrect" });
        }

        const userPayload = { email: user.email, /* Add other relevant claims */ };
        const token = generateToken(userPayload);

        return res.status(200).json({ token, response: "User successfully logged in" });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ response: "Internal Server Error" });
    }
});


app.post("/Online/:isOnline", async (req, res) => {
    try {
        const { TradesmanId } = req.body;
        const isOnline = parseInt(req.params.isOnline);

        if (isNaN(isOnline) || (isOnline !== 0 && isOnline !== 1)) {
            return res.status(400).json({ Error: "Param value should be either 0 or 1" });
        }
        const updateOperation = { $set: { available: isOnline === 1 } };
        const filter = { _id: TradesmanId }
        await EmployeeModel.updateOne(filter, updateOperation);

        const responseMessage = isOnline === 1 ? "User successfully online" : "User successfully offline";

        res.status(200).json({ response: responseMessage });
    } catch (err) {
        console.error(err);
        res.status(500).json({ Error: "Internal Server Error" });
    }
});



module.exports = app;
