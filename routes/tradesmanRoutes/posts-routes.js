const express = require("express");
const app = express();
const mongodb = require("mongodb");
const mongoose = require("mongoose");
const { hashPassword, registerEmployee, EmployeeModel, comparePasswords, PostsModel } = require("../../Functions/general_functions");

// This middleware is necessary to parse the request body in JSON format
app.use(express.json());


app.post("/post/:TradesmanEmail", async (req, res) => {

})