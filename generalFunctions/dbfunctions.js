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

// Define a Task schema
const EmployeeSchema = new mongoose.Schema({
    firstname: String,
    lastname: String,
    password: String,
    email: String
});

const EmployeeModel = mongoose.model('Employee', EmployeeSchema);

async function registerEmployee(firstname, lastname, password, email) {
    try {
        const newEmployee = new EmployeeModel({
            firstname: firstname,
            lastname: lastname,
            password: password,
            email: email
        });
        await newEmployee.save();
        console.log("Saved new employee:", newEmployee);
    } catch (err) {
        console.error("Error:", err);
    }
}



async function hashPassword(password) {
    try {
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword;
    } catch (error) {
        throw error;
    }
}

async function comparePasswords(inputPassword, hashedPassword) {
    try {
        const match = await bcrypt.compare(inputPassword, hashedPassword);
        return match;
    } catch (error) {
        throw error;
    }
}







module.exports = { hashPassword, comparePasswords, registerEmployee, EmployeeModel }





