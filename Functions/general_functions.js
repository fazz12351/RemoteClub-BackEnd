const { BookingModel, EmployeeModel } = require("./databaseSchema")
const bcrypt = require("bcrypt")

async function registerEmployee(firstname, lastname, password, email) {
    try {
        const newEmployee = new EmployeeModel({
            firstname: firstname,
            lastname: lastname,
            password: password,
            email: email,
            available: false,
            bookings: []

        });
        await newEmployee.save();
        console.log("Saved new employee:", newEmployee);
    } catch (err) {
        console.error("Error:", err);
    }
}


async function hashPassword(password) {
    try {
        const saltRounds = 10;
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





