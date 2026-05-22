const Booking = require("../models/Booking");
const Room = require("../models/Room");
const sendMessage = require("../services/smsServices");

// STEP 1: Customer creates a fresh Booking request
exports.createBooking = async (req, res) => {
    try {
        const { room, startDate, endDate } = req.body;
        //check if the room exist

        const roomExist = await Room.findById(room);
        if (!roomExist) {
            return res.status(404).json({ message: "Room does not exist" });
        }
          //check if the room is already booked
        
        if (roomExist.roomStatus === "booked" || roomExist.roomStatus === "checked-in") {
            return res.status(400).json({ message: "Room is currently unavailable" });
        }
         //create a new booking
        const booking = await Booking.create({
            user: req.user.id, 
            room,
            startDate,
            endDate,
        });

        res.status(201).json({
            message: "Booking created successfully",
            booking,
        });

        // SOCKET: alert admin of a new booking
        const io = req.app.get("io");
        if (io) {
            io.to("adminRoom").emit("notification", {
                title: "New Booking Request",
                message: `${req.user.name || "A customer"} has requested a room.`,
                bookingId: booking._id
            });
        }

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// STEP 2: Fetch all hotel records (Admin and Receptionist view)
exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find().populate("user").populate("room");
        res.status(200).json({ message: "Bookings fetched successfully", bookings });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// STEP 3: Fetch private profile records (Customer view)
exports.getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user.id }).populate("user").populate("room");
        res.status(200).json({ message: "My bookings successfully fetched", bookings });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// STEP 4: Admin accepts the booking request
exports.acceptBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate("user");

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.bookingStatus !== "pending") {
            return res.status(400).json({ message: "Booking already processed" });
        }

        booking.bookingStatus = "accepted";
        await booking.save();

        const room = await Room.findById(booking.room);
        if (room) {
            room.roomStatus = "booked";
            await room.save();
        };

        //get customers phonenumber
        const phone =  booking.user?.phoneNumber;

        if (!phone) {
            return res.status(400).json({
                message: "User has no phone number"
            });
        }
        //send sms
        await sendMessage(
            phone,
            `Hello ${booking.user.name}, Your booking has been accepted.`
        );
        res.status(200).json({
            message: "Booking accepted and sms sent",
            booking
        })
        const io = req.app.get("io");
        if (io) {
            // Tell everyone the room is booked
            io.emit("roomUpdated", booking.room);

            if (booking.user) {
                io.to(booking.user._id.toString()).emit("notification", {
                    message: "Your booking has been approved!",
                    status: "accepted"
                });
            }

            io.to("adminRoom").emit("bookingUpdated", booking);
            io.to("receptionistRoom").emit("bookingUpdated", booking);
        }

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// STEP 5: Admin rejects the booking request
exports.rejectBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate("user");

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        booking.bookingStatus = "rejected";
        await booking.save();

        res.status(200).json({ message: "Booking rejected", booking });

        const io = req.app.get("io");
        if (io) {
            // tell a specific customer their booking has been rejected
            if (booking.user) {
                io.to(booking.user._id.toString()).emit("notification", {
                    message: "Your booking has been rejected.",
                    status: "rejected"
                });
            }

            io.to("adminRoom").emit("bookingUpdated", booking);
        }

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// STEP 6: Receptionist processes check-in event upon guest arrival
exports.checkIn = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate("user");

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        //only checkin  a customer when the booking status is accpted

        if (booking.bookingStatus !== "accepted") {
            return res.status(400).json({ message: "Only accepted bookings can be checked in" });
        }

        const room = await Room.findById(booking.room);
        if (!room || room.roomStatus !== "booked") {
            return res.status(400).json({ message: "Room must be booked before check-in" });
        }

        booking.bookingStatus = "checked-in";
        booking.checkInDate = new Date();
        await booking.save();

        // Update the operational room status flag
        room.roomStatus = "checked-in";
        await room.save();

        res.status(200).json({ message: "Customer checked in successfully", booking });
              // Notify a customer they have checked in to their room
        const io = req.app.get("io");
        if (io) {
            io.emit("roomUpdated", booking.room);

        
            if (booking.user) {
                io.to(booking.user._id.toString()).emit("notification", {
                    message: "You have checked-in to your room!",
                    status: "checked-in"
                });
            }

            io.to("receptionistRoom").emit("bookingUpdated", booking);
            io.to("adminRoom").emit("bookingUpdated", booking);
        }

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// STEP 7: Receptionist processes checkout event upon departure
exports.checkOut = async (req, res) => {
    try {
        
        const booking = await Booking.findById(req.params.id).populate("user");

        if (!booking) {
            return res.status(404).json({ message: "Booking does not exist" });
        }

        if (booking.bookingStatus !== "checked-in") {
            return res.status(400).json({ message: "Cannot checkout before checking in" });
        }

        booking.bookingStatus = "checked-out";
        booking.checkOutDate = new Date();
        await booking.save();

        // Reset room back to available state so new guests can use it
        const room = await Room.findById(booking.room);
        if (room) {
            room.roomStatus = "available";
            await room.save();
        }

        res.status(200).json({ message: "Customer checked out successfully", booking });
             //Notify a customer they have checked-out of their room
        const io = req.app.get("io");
        if (io) {
            io.emit("roomUpdated", booking.room);

            if (booking.user) {
                io.to(booking.user._id.toString()).emit("notification", {
                    message: "You have checked-out of your room!",
                    status: "checked-out"
                });
            }

            io.to("receptionistRoom").emit("bookingUpdated", booking);
            io.to("adminRoom").emit("bookingUpdated", booking);
        }

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
