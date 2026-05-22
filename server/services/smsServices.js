require("dotenv").config();
const User = require("../models/User");

// Initialize Africa's Talking 
const AfricasTalking = require("africastalking")({
    apiKey: process.env.AT_API_KEY,
    username: process.env.AT_USERNAME
});

const sms = AfricasTalking.SMS;

async function sendMessage() {
    try {

        // Get all customers
        const users = await User.find({ role: "customer" });

        // Extract phone numbers
        const numbers = users.map(user => user.phoneNumber);

        const options = {
            to: numbers,
            message: "Your booking has been approved"
        };

        const response = await sms.send(options);
        console.log(response);

    } catch (err) {
        console.log(err);
    }
}

sendMessage();