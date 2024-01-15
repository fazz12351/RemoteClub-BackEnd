const express = require("express");
const app = express();

const mongodb = require("mongodb")
const mongoose = require("mongoose")


app.get("/test", async (req, res) => {
    console.log("I'm testing");
    res.send("Hello, World!"); // Sending a response to the client
});



module.exports = app; // Correct export statement
