const mongoose = require("mongoose");
// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/RemoteClub', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

const bcrypt = require('bcrypt');
const saltRounds = 10; // Number of salt rounds

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

const BookingSchema = new mongoose.Schema({
    firstname: String,
    lastname: String,
    telephone: Number,
    address: String,
    jobtitle: String,
    jobdescription: String
})

// Define a Task schema
const EmployeeSchema = new mongoose.Schema({
    firstname: String,
    lastname: String,
    password: String,
    email: String,
    available: Boolean,
    booking: [BookingSchema],
});
const BookingModel = new mongoose.model("Bookings", BookingSchema)

const EmployeeModel = mongoose.model('Employee', EmployeeSchema);

module.exports = { BookingModel, EmployeeModel }