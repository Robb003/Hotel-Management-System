require("dotenv").config();

const AfricasTalking = require("africastalking")({
    apiKey: process.env.AT_API_KEY,
    username: process.env.AT_USERNAME
});

const sms = AfricasTalking.SMS;

async function sendMessage(to, message) {
    try {
        const options = {
            to,
            message
        };

        const response = await sms.send(options);
        console.log(response);

    } catch (err) {
        console.log("SMS error:", err.message);
    }
}

module.exports = sendMessage;