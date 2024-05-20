const { BookingModel, EmployeeModel } = require("./databaseSchema")
// const bcrypt = require('bcrypt');
const bcrypt = require('bcryptjs');

const s3Client = require("../Functions/configuration")
require('dotenv').config();
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

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


const s3Upload = async (file, currentTime) => {
    // Handle if file is not present
    if (!file) {
        throw new Error('File is undefined');
    }

    const params = {
        Bucket: process.env.AWS_BUCKET,
        Key: `${file.originalname}${currentTime}`,
        Body: file.buffer,
        ContentType: file.mimetype,
    };

    const s3PutCommand = new PutObjectCommand(params);
    await s3Client.send(s3PutCommand);

    return file.originalname;
};

const s3Retrieve = async (fileName) => {
    try {
        const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET,
            Key: fileName,
        });

        const urlExpiration = 3600;

        const fileUrl = await getSignedUrl(s3Client, command, {
            expiresIn: urlExpiration,
            responseContentDisposition: 'inline' // Display the file in the browser
        });

        return fileUrl;

    } catch (error) {
        console.error("Error generating pre-signed URL:", error);
        throw error;
    }
};








module.exports = { hashPassword, comparePasswords, registerEmployee, EmployeeModel, s3Retrieve, s3Upload }





