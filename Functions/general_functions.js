const { BookingModel, EmployeeModel } = require("./databaseSchema")
// const bcrypt = require('bcrypt');
const bcrypt = require('bcryptjs');
const axios = require("axios")

const { s3Client } = require("../Functions/configuration")
require('dotenv').config();
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

async function registerEmployee(firstname, lastname, password, email, telephone) {
    try {
        const newEmployee = new EmployeeModel({
            firstname: firstname,
            lastname: lastname,
            password: password,
            email: email,
            telephone: telephone,
            available: false,
            profile_picture: null,
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


const s3Upload = async (file, currentTime, userId) => {
    // Handle if file is not present
    if (!file) {
        throw new Error('File is undefined');
    }

    const params = {
        Bucket: process.env.AWS_BUCKET,
        Key: `${userId}@${currentTime}${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
    };

    const s3PutCommand = new PutObjectCommand(params);
    await s3Client.send(s3PutCommand);

    return params.Key;
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

const s3Delete = async (fileName) => {
    try {
        const command = new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET,
            Key: fileName,
        });

        const response = await s3Client.send(command);
        console.log("Successfully deleted:", response);
        return response;
    } catch (error) {
        console.error("Error deleting object:", error);
        throw error;
    }
};
const getCoordinates = async (address) => {
    const apiKey = process.env.GEOLOCATIONAPI; // Replace with your OpenCage API key
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${address}&key=${apiKey}`;
    try {
        const response = await axios.get(url);
        if (response.data.results.length > 0) {
            return true
        } else {
            return false
        }
    } catch (error) {
        return error

    }
};
const formatPhoneNumber = (phoneNumber, countryCode) => {
    if (phoneNumber.length != 11) {
        return false
    }
    // Remove any non-numeric characters
    let cleaned = phoneNumber.replace(/\D/g, '');

    // Remove leading zeros
    if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }

    // Add the country code
    return `+${countryCode}${cleaned}`;
};






module.exports = { hashPassword, comparePasswords, registerEmployee, EmployeeModel, s3Retrieve, s3Upload, s3Delete, getCoordinates, formatPhoneNumber }





