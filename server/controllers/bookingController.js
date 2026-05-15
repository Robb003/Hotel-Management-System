const Booking = require("../models/Booking");
const Room = require("../models/Room");

// only a customer can create a Booking
exports.CreateBooking = async (req, res) => {
    try {
        const { room, startDate, endDate } = req.body;

        // check if room exists
        const roomExist = await Room.findById(room);
        if (!roomExist) {
            return res.status(404).json({ message: "room does not exist" });
        }

        if (roomExist.roomStatus === "booked") {
            return res.status(400).json({
                message: "Room is already booked"
            });
        }

        const booking = await Booking.create({
            user: req.user.id,
            room,
            startDate,
            endDate,
        });

        res.status(201).json({
            message: "booking created successfully",
            booking,
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// both admin and receptionist can getAllBookings
exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate("user")
            .populate("room");

        res.status(200).json({
            message: "bookings fetched successfully",
            bookings,
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// only a customer can get their booking
exports.getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({
            user: req.user.id,
        })
            .populate("user")
            .populate("room");

        res.status(200).json({
            message: "my booking successfully fetched",
            bookings,
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// accept booking
exports.acceptBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: "booking not found" });
        }

        if (booking.bookingStatus !== "pending") {
            return res.status(400).json({
                message: "Booking already processed"
            });
        }

        booking.bookingStatus = "accepted";
        await booking.save();

        // update room status
        const room = await Room.findById(booking.room);
        room.roomStatus = "booked";
        await room.save();

        res.status(200).json({
            message: "booking accepted",
            booking,
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// reject booking
exports.rejectBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: "booking not found" });
        }

        booking.bookingStatus = "rejected";
        await booking.save();

        res.status(200).json({
            message: "booking rejected",
            booking,
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// check in
exports.checkIn = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: "booking not found" });
        }

        // must be accepted first
        if (booking.bookingStatus !== "accepted") {
            return res.status(400).json({
                message: "Only accepted bookings can be checked in"
            });
        }

        const room = await Room.findById(booking.room);

        if (room.roomStatus !== "booked") {
            return res.status(400).json({
                message: "Room must be booked before check-in"
            });
        }

        booking.bookingStatus = "checked-in";
        booking.checkInDate = new Date();

        await booking.save();

        res.status(200).json({
            message: "customer checked in",
            booking,
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// check out
exports.checkOut = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: "booking does not exist" });
        }

        if (booking.bookingStatus !== "checked-in") {
            return res.status(400).json({
                message: "Cannot checkout before check-in"
            });
        }

        booking.bookingStatus = "checked-out";
        booking.checkOutDate = new Date();

        await booking.save();

        // make room available again
        const room = await Room.findById(booking.room);
        room.roomStatus = "available";
        await room.save();

        res.status(200).json({
            message: "customer checked out",
            booking,
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};