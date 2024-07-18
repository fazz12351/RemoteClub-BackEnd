const express = require("express");
const app = express();
const mongodb = require("mongodb");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken")
const registerTradesman = require("../../Functions/general_functions");
const { hashPassword, registerEmployee, EmployeeModel, comparePasswords, formatPhoneNumber } = require("../../Functions/general_functions");
const { generateToken, verifyToken } = require("../../Functions/middleware/authorisation")
const { VerificationModel } = require("../../Functions/databaseSchema")
const { v4: uuidv4 } = require('uuid');
const sendMessage = require("../../Functions/Twilio");
// This middleware is necessary to parse the request body in JSON format
app.use(express.json());

app.get("/test", verifyToken, async (req, res) => {
    const userIdFromToken = req.user
    res.status(200).json({ responce: "its working" })

});



app.post("/register_Tradesman", async (req, res) => {
    const { firstname, lastname, password, email, telephone } = req.body;

    if (!firstname || !lastname || !password || !email || !telephone) {
        return res.status(400).json({ response: "All fields are required" });
    }

    try {
        const userExists = await EmployeeModel.exists({ email });

        if (userExists) {
            return res.status(409).json({ response: "User already exists with that email" });
        }

        const hashedPassword = await hashPassword(password);
        const formattedTelephone = formatPhoneNumber(telephone, "44");

        if (!formattedTelephone) {
            return res.status(400).json({ response: "Invalid telephone format" });
        }

        await registerEmployee(firstname, lastname, hashedPassword, email, formattedTelephone);
        return res.status(201).json({ response: "User successfully registered" });

    } catch (err) {
        console.error("Error during registration:", err);
        return res.status(500).json({ response: "Internal Server Error", error: err.message });
    }
});




app.post("/login_Tradesman", async (req, res) => {
    try {
        console.log("being called")
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

        const userPayload = { email: user.email, id: user.id, telephone: user.telephone /* Add other relevant claims */ };
        const token = generateToken(userPayload);

        return res.status(200).json({ token, response: "User successfully logged in" });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ response: "Internal Server Error" });
    }
});

app.post("/send_verificationCode", verifyToken, async (req, res) => {
    try {
        const randomCode = uuidv4().toString()
        const code = randomCode.slice(0, 8)

        const checkIfCodeExists = await VerificationModel.find({ userId: req.user.id })

        if (checkIfCodeExists.length > 0) {
            return res.status(400).json({ Error: "Code created already  for this number" })
        }

        await sendMessage(req.user.telephone, `Your Secret Code is ${code}`)
        const newCode = new VerificationModel({
            userId: req.user.id,
            code: code
        })
        await newCode.save()
        return res.status(200).json({ responce: "code created sucesfully" })

    }
    catch (err) {
        return res.status(400).json({ Error: err })
    }
})

//verify a users telephone
app.post("/check_verificationCode", verifyToken, async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.user.id;

        // Check if there is a verification entry for the given code and userId
        const verificationEntry = await VerificationModel.findOne({ code: code });

        if (verificationEntry) {
            // Verification entry found
            await VerificationModel.deleteOne({ _id: verificationEntry._id });
            return res.status(200).json({ response: "User verified" });
        } else {
            // No verification entry found
            await VerificationModel.deleteMany({ userId: userId });
            return res.status(400).json({ error: "Verification code not valid or expired" });
        }
    } catch (err) {
        console.error("Error checking verification code:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});



app.post("/Online/:isOnline", verifyToken, async (req, res) => {
    try {
        const { TradesmanId } = req.user.id;
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

app.delete("/deleteUser", verifyToken, async (req, res) => {
    try {
        await EmployeeModel.deleteOne({ email: req.user.email }).then(() => {
            res.status(200).json({ responce: "user deleted succesfully" })
        })

    }
    catch (err) {
        res.status(500).json({ err: "Internal server error" })
    }
})



module.exports = app;
