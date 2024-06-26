const { TwilioClient } = require("../Functions/configuration")

const formatPhoneNumber = (phoneNumber, countryCode) => {
    // Remove any non-numeric characters
    let cleaned = phoneNumber.replace(/\D/g, '');

    // Remove leading zeros
    if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }

    // Add the country code
    return `+${countryCode}${cleaned}`;
};

async function sendMessage(toNumber, messege) {
    try {
        toNumber = formatPhoneNumber(toNumber, "44")
        // Example: Send an SMS
        await TwilioClient.messages.create({
            body: messege,
            to: toNumber,  // Replace with your phone number
            from: '+1 949 407 5466' // Replace with your Twilio number
        })

    }
    catch (err) {
        console.log(err)
    }

}


module.exports = sendMessage