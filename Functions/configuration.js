require('dotenv').config();
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const Twilio = require('twilio/lib/rest/Twilio');
// Your Twilio credentials


const accountSid = process.env.ACCOUNTSID; // Replace with your Account SID from www.twilio.com/console
const authToken = process.env.AUTHTOKENTWILIO   // Replace with your Auth Token from www.twilio.com/console

// Initialize the Twilio client
const TwilioClient = new Twilio(process.env.ACCOUNTSID, process.env.AUTHTOKENTWILIO);


const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACESS_KEY
  }
});


module.exports = { s3Client, TwilioClient }
