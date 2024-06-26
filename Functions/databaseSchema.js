const mongoose = require("mongoose");
require('dotenv').config();



// Connect to MongoDB
mongoose.connect(process.env.MONGODB_CONNECTION_ENDPOINT, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

// const bcrypt = require('bcrypt');
const bcrypt = require('bcryptjs');

const saltRounds = process.env.SALT_ROUNDS; // Number of salt rounds


db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

const PostsSchema = new mongoose.Schema({
    title: String,
    createdAt: String,
    videoName: String,
    tradesmansId: String,
})


const BookingSchema = new mongoose.Schema({
    firstname: String,
    lastname: String,
    telephone: Number,
    address: String,
    jobtitle: String,
    jobdescription: String,
    video_name: PostsSchema
})

const CustomerSchema = new mongoose.Schema({
    firstname: String,
    lastname: String,
    password: String,
    address: String,
    telephone: Number,
    email: String,
    jobsPosted: [BookingSchema]
})


// Define a Task schema
const EmployeeSchema = new mongoose.Schema({
    firstname: String,
    lastname: String,
    password: String,
    email: String,
    available: Boolean,
    telephone: String,
    booking: [BookingSchema],
    posts: [PostsSchema]
});


const CustomerModel = new mongoose.model("customer", CustomerSchema)

const BookingModel = new mongoose.model("Bookings", BookingSchema)

const EmployeeModel = mongoose.model('Employee', EmployeeSchema);

const PostsModel = new mongoose.model("posts", PostsSchema);

module.exports = { BookingModel, EmployeeModel, PostsModel, CustomerModel }