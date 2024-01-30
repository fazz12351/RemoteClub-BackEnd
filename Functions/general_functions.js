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

function checkToken(token) {
    try {
        const secretKey = "my_secret_key"
        // Verify the token using the secret key
        const decoded = jwt.verify(token, secretKey);

        // If verification succeeds, the token is valid
        console.log('Token is valid');
        console.log('Decoded payload:', decoded);

        // You can access specific claims from the decoded payload
        // For example, user ID: decoded.sub

        return true;
    } catch (error) {
        // If verification fails, the token is invalid
        console.error('Token verification failed:', error.message);
        return false;
    }
}








module.exports = { hashPassword, comparePasswords, registerEmployee, EmployeeModel }





