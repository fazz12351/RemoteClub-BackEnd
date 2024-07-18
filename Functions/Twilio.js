const { TwilioClient } = require("../Functions/configuration")

async function sendMessage(toNumber, body) {
    try {
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