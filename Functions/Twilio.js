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

async function sendMessage(toNumber, body) {
    try {
        toNumber = formatPhoneNumber(toNumber, "44")
        await TwilioClient.messages
            .create({
                body: body,
                from: process.env.FROMTWILONUMBER,
                to: toNumber
            })
    }
    catch (err) {
        console.log(err)
    }

}

module.exports = sendMessage