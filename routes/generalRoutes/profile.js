const express = require("express")
const app = express()

const { EmployeeModel, CustomerModel } = require("../../Functions/databaseSchema")
const { s3Retrieve } = require("../../Functions/general_functions")
const { verifyToken } = require("../../Functions/middleware/authorisation")

app.get("/:userId", verifyToken, async (req, res) => {
    const userId = req.params.userId
    try {
        const checkCustomer = await CustomerModel.findById({ _id: userId })
        if (checkCustomer != null) {
            let profile_picture = checkCustomer.profile_picture ? await s3Retrieve(checkCustomer.profile_picture) : null;
            const filteredData = { _id: checkCustomer._id, firstname: checkCustomer.firstname, lastname: checkCustomer.lastname, email: checkCustomer.email, profile_picture: profile_picture }
            return res.status(200).json(filteredData)
        }
        const checkEmployees = await EmployeeModel.findById({ _id: userId })
        if (checkEmployees != null) {
            let profile_picture = checkEmployees.profile_picture ? await s3Retrieve(checkEmployees.profile_picture) : null;
            const filteredData = { _id: checkEmployees._id, firstname: checkEmployees.firstname, lastname: checkEmployees.lastname, email: checkEmployees.email, profile_picture: profile_picture }
            return res.status(200).json(filteredData)
        }
        return res.status(204).json({ response: "user Doesnt exist" })

    } catch (err) {
        console.log(err)
        return res.status(400).json({ "Error": err })
    }

})

module.exports = app
