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
    Id: String,
    postId: String
})


const BookingSchema = new mongoose.Schema({
    firstname: String,
    lastname: String,
    telephone: Number,
    address: String,
    jobtitle: String,
    jobdescription: String,
    video_name: String
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
    profile_picture: String,
    booking: [BookingSchema],
    posts: [PostsSchema]
});



const VerificationSchema = new mongoose.Schema({
    userId: String,
    code: String
})



//Stores customer Information
const CustomerModel = new mongoose.model("Customers", CustomerSchema)

//Stores information About a Job Posted
const BookingModel = new mongoose.model("OpenJobs", BookingSchema)

//Stores information About Employess
const EmployeeModel = mongoose.model('Employees', EmployeeSchema);

//BluePrint of how a post is structured. This also stores posts by Tradesman
const PostsModel = new mongoose.model("Posts", PostsSchema);

module.exports = { BookingModel, EmployeeModel, PostsModel, CustomerModel }