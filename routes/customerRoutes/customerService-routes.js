const express = require('express');
const bodyParser = require('body-parser');
const { TwilioClient } = require('../../Functions/configuration'); // Assuming TwilioClient is exported from configuration
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));

// Route to handle incoming voice requests
app.post('/voice', (req, res) => {
    const twiml = new TwilioClient.twiml.VoiceResponse();
    twiml.say("thanks for calling Tradesmans App, we are currently away");
    twiml.pause({ length: 1 });

    res.type('text/xml');
    res.send(twiml.toString());
});

// Route to initiate a call
app.post("/call", async (req, res) => {
    try {
        const client = TwilioClient; // Assuming client is the Twilio client instance from configuration
        const call = await client.calls.create({
            twiml: '<Response><Say>Hello! Thank you for calling Tradesmans Centre.</Say></Response>',
            to: '+447471138575', // Replace with the recipient's phone number
            from: process.env.FROMTWILONUMBER // Replace with your Twilio phone number
        });

        console.log(`Call initiated! Call SID: ${call.sid}`);
        res.status(200).json({ message: `Call initiated! Call SID: ${call.sid}` });
    } catch (err) {
        console.error('Error making call:', err);
        res.status(500).json({ error: 'Failed to initiate call' });
    }
});

module.exports = app;
