const express = require("express");
const app = express();

const mongodb = require("mongodb")
const mongoose = require("mongoose")
const { registerTradesman, hashPassword, comparePasswords } = require("../generalFunctions/dbfunctions")


app.get("/test", async (req, res) => {
    console.log("working")

});

app.post("/registerTradesman", async (req, res) => {
    try {
        const { firstname, lastname, password } = req.body
        if (firstname && lastname && password) {
            password = hashPassword(password)
            await registerTradesman(firstname, lastname, password)
            res.status(200).json({ responce: "User succesfully registered" })
        }
        else {
            res.status(500).json({ responce: "Not all fields were valid" })
        }

    }
    catch (err) {
        console.log("Error")
    }
})

let message = hashPassword("faeem")
console.log(message)



module.exports = app; // Correct export statement
