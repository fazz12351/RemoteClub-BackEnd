const AWS = require("aws-sdk");
const { S3Client } = require("@aws-sdk/client-s3");
const {
    DeleteObjectCommand,
    PutObjectCommand,
    GetObjectCommand
} = require("@aws-sdk/client-s3");

const {
    getSignedUrl
} = require("@aws-sdk/s3-request-presigner");


const s3Client = new S3Client({
    region: "eu-west-2",
    credentials: {
        accessKeyId: "AKIAYFCINAAS3HPUQFHF",
        secretAccessKey: "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"
    }
});

// Update AWS configuration with the correct region
AWS.config.update({
    accessKeyId: 'AKIAYFCINAAS3HPUQFHF',
    secretAccessKey: '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',
    region: 'eu-west-2', // London region
    signatureVersion: 'v4' // Use AWS Signature Version 4
});


const s3 = new AWS.S3();

const s3Upload = async (file, currentTime) => {
    // Hanldes  if file is not present
    if (!file) {
        throw new Error('File is undefined')
    }


    /* Resize the image to the what is specified (DOESNT WORK WITH VIDEOS) */
    //const buffer = await sharp(file.buffer).resize({height: 1920, width: 1080, fit: "contain"}).toBuffer()

    const params = {
        Bucket: "remoteclub-s3-bucket1",
        Key: `${file.originalname}${currentTime}`,
        Body: file.buffer,
        ContentType: file.mimetype,
    };

    const s3PutCommand = new PutObjectCommand(params);
    await s3Client.send(s3PutCommand);

    return file.originalname
};

const s3Retrieve = async (fileName) => {
    try {
        const command = new GetObjectCommand({
            Bucket: "remoteclub-s3-bucket1",
            Key: fileName,
        });

        const urlExpiration = 3600;

        const fileUrl = await getSignedUrl(s3Client, command, {
            expiresIn: urlExpiration
        });

        return fileUrl;

    } catch (error) {
        console.error("Error generating pre-signed URL:", error);
        throw error;
    }
};





module.exports = { s3Upload, s3Retrieve };
