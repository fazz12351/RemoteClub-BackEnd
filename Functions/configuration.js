require('dotenv').config();
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");


const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_ACESS_KEY
    }
});
module.exports = s3Client
