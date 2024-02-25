const bodyParser = require("body-parser")
const express = require("express")
const app = express()

const {
    BookingModel
} = require("../../Functions/databaseSchema")

app.use(bodyParser.urlencoded({
    extended: true
}))

app.get("/openJobs", async (req, res) => {
    try {
        const availableJobs = await BookingModel.find({})

        res.status(200).json({
            responce: availableJobs
        })


    } catch (err) {
        console.log(err)
    }
})


module.exports = app