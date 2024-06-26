const express = require("express");
const app = express();
const { EmployeeModel, getCoordinates } = require("../../Functions/general_functions");
const { CustomerModel, BookingModel } = require("../../Functions/databaseSchema");
const bodyParser = require("body-parser");
const { verifyToken } = require("../../Functions/middleware/authorisation");

app.use(bodyParser.urlencoded({
    extended: true
}))


const {
    ObjectId
} = require('mongoose').Types;

app.post("/bookJob/:tradesmanId", verifyToken, async (req, res) => {

    try {
        const tradesmansId = req.params.tradesmanId;
        const {
            jobtitle,
            jobdescription
        } = req.body;

        const tradesmansName = await EmployeeModel.findById({
            "_id": tradesmansId
        })

        const customerInformation = await CustomerModel.findById({
            "_id": req.user.id
        })
        const {
            firstname,
            lastname,
            telephone,
            address
        } = customerInformation


        // Use findOneAndUpdate to find the tradesman by email and push a new job to the booking array
        const updatedTradesman = await EmployeeModel.findByIdAndUpdate(
            tradesmansId, {
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
        }, {
            new: true
        } // Return the updated document
        );

        if (updatedTradesman) {
            return res.status(200).json({
                response: `Job booked successfully with ${tradesmansName.firstname + " " + tradesmansName.lastname}`,
                jobDescription: req.body
            });
        } else {
            return res.status(404).json({
                response: "Tradesman not found"
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            response: "Internal Server Error"
        });
    }
});


app.post("/postJob", verifyToken, async (req, res) => {
    try {
        const currentCustomerId = new mongoose.Types.ObjectId(req.user.id);


        const exists = await CustomerModel.findById(currentCustomerId);

        if (!exists) {
            return res.status(404).json({
                responce: "Customer id doesnt exist"
            })
        }

        const {
            jobtitle,
            jobdescription,
            address
        } = req.body;
        const {
            firstname,
            lastname,
            telephone,
        } = exists
        if (!jobtitle || !jobdescription) {
            return res.status(400).json({
                responce: "missing fields"
            })
        }
        const validAddress = await getCoordinates(address)

        if (validAddress === false || address.length < 2) {
            return res.status(400).json({
                error: "The address you entered doesn't seem to exist. Please ensure to add a valid location either using a postcode or a full address."
            });
        }


        // Create a new booking instance. //Add picttueres for video facility.
        const newBooking = new BookingModel({
            firstname,
            lastname,
            telephone,
            address,
            jobtitle,
            jobdescription,
        });

        // Save the new booking to the database
        await newBooking.save();

        // Update the tradesman's booking
        await CustomerModel.findByIdAndUpdate(currentCustomerId, {
            $push: {
                jobsPosted: newBooking
            }
        }, {
            new: true
        }) // Return the updated document 

        return res.status(200).json({
            response: `Job has been posted successfully for a ${jobtitle} service`,
            bookingInformation: newBooking,
        });
    } catch (error) {
        console.error(error);
        // Handle validation errors
        if (error.name === "ValidationError") {
            return res.status(400).json({
                response: "Validation Error",
                errors: error.errors
            });
        }
        // Handle other errors
        res.status(500).json({
            response: "Internal Server Error"
        });
    }
});



module.exports = app;