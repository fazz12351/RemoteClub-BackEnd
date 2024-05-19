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

const s3Upload = async (file, currentTime) => {
    // Handle if file is not present
    if (!file) {
        throw new Error('File is undefined');
    }

    const params = {
        Bucket: "remoteclub-s3-bucket1",
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
            Bucket: "remoteclub-s3-bucket1",
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

module.exports = { s3Upload, s3Retrieve };
