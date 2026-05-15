const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    room: {type: mongoose.Schema.Types.ObjectId, ref: "Room"},
    bookingStatus: {type: String, required: true, enum: ["accepted", "pending", "rejected", "checked-in", "checked-out"], default: "pending"},
    checkInDate: {type: Date},
    checkOutDate: {type: Date},
    startDate: {type: Date, required: true},
    endDate: {type: Date, required: true},
    numberOfDays: {type: Number},
    totalPrice: {type: Number},
}, {timestamps: true}
);

//calculation
bookingSchema.pre("save", async function(next){
    const Room = mongoose.model("Room");
    const room = await Room.findById(this.room);

    //calculate number of numberOfDays
    const days = Math.ceil(
        (this.endDate - this.startDate) /
        (1000 * 60 * 60 * 24)
    );
    this.numberOfDays = days;
    //calculate totalPrice
    this.totalPrice =days * room.pricePerDay;
    next();
});

module.exports = mongoose.model("Booking", bookingSchema);