const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
    roomNumber: {type: String, required: true, unique: true, trim: true},
    roomType: {type: String, required: true, enum: ["single", "double", "deluxe", "suite"], },
    pricePerDay: {type: Number, required: true, min: 0},
    description: {type: String, required: true, trim: true},
    roomStatus: {type: String, required: true, enum: ["available", "booked"], default: "available"},
    image: [{
        path: {type: String, required: true},
        filename: {type: String, required: true}
    }]
}, {timestamps: true}
);

module.exports = mongoose.model("Room", roomSchema);