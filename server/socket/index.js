const Booking = require("../models/Booking");
const User = require("../models/User");
const Room = require("../models/Room");

module.exports = (io) => {
    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // ROOM JOINING LISTENERS ---

        // Admins join a global admin room for real-time dashboard alerts
        socket.on("joinAdmin", () => {
            socket.join("adminRoom");
            console.log("Admin joined adminRoom");
        });

        // Receptionists join a global receptionist room for general alerts
        socket.on("joinReceptionist", () => {
            socket.join("receptionistRoom");
            console.log("Receptionist joined receptionistRoom");
        });

        // Geusts/Customers join an isolated room named after their database ID
        socket.on("joincustomer", (userId) => {
            socket.join(userId);
            console.log(`Customer ${userId} joined their private room`);
        });


        // 2. BOOKING LIFECYCLE LISTENERS ---

        // STEP 1: Customer submits a raw booking reservation request
        socket.on("sendBooking", async (data) => {
            try {
                const { customerId, roomId, startDate, endDate } = data;
                
                const newBooking = await Booking.create({
                    customer: customerId,
                    room: roomId,
                    startDate,
                    endDate,
                });

                const customer = await User.findById(customerId);

                // Instantly update the admin dashboard with a live push notification
                io.to("adminRoom").emit("notification", {
                    title: "New Booking Request",
                    message: `${customer?.name || "A customer"} is requesting a room.`,
                    bookingId: newBooking._id
                });
            } catch (error) {
                console.error("Booking error:", error.message);
            }
        });

        // STEP B: Admin accepts the submitted room reservation
        socket.on("acceptBooking", async (data) => {
            try {
                const { bookingId } = data;
                
                // Update booking document status flag
                const booking = await Booking.findByIdAndUpdate(
                    bookingId,
                    { status: "accepted" },
                    { new: true }
                ).populate("room customer");

                if (!booking) return;

                // Lock room status to prevent other users from booking it
                if (booking.room) {
                    booking.room.status = "booked"; 
                    await booking.room.save();
                }

                // Alert the receptionist dashboard that a booking was approved
                io.to("receptionistRoom").emit("notification", {
                    message: `Booking for room ${booking.room?.roomNumber || ""} was approved.`
                });

                // Alert the specific customer through their private socket channel
                const customerRoom = booking.customer?._id?.toString();
                if (customerRoom) {
                    io.to(customerRoom).emit("notification", {
                        message: "Your booking has been approved!",
                        bookingId: booking._id,
                        status: "accepted"
                    });
                }

                // Broadcast to all active browsers to update available rooms UI
                io.emit("roomUpdated", booking.room);
                
                // Sync updated records with admin data tracking arrays
                io.to("adminRoom").emit("bookingUpdated", booking);

            } catch (error) {
                console.error("Accept booking error:", error.message);
            }
        });

        // STEP C: Admin rejects the submitted room reservation
        socket.on("rejectBooking", async (data) => {
            try {
                const { bookingId } = data;
                
                // Set booking document status to rejected
                const booking = await Booking.findByIdAndUpdate(
                    bookingId,
                    { status: "rejected" },
                    { new: true }
                ).populate("room customer");

                if (!booking) return;

                // Unlock room back to available status
                if (booking.room) {
                    booking.room.status = "available";
                    await booking.room.save();
                }

                // Push rejection message directly to the customer's feed
                const customerRoom = booking.customer?._id?.toString();
                if (customerRoom) {
                    io.to(customerRoom).emit("notification", {
                        message: "Sorry, your booking was rejected.",
                        bookingId: booking._id,
                        status: "rejected"
                    });
                }

                // Broadcast the room status reset to all clients
                io.emit("roomUpdated", booking.room);
                io.to("adminRoom").emit("bookingUpdated", booking);

            } catch (error) {
                console.error("Reject booking error:", error.message);
            }
        });

        // STEP D: Receptionist physically checks the guest into the hotel room
        socket.on("check-in", async (data) => {
            try {
                const { bookingId } = data;
                
                const booking = await Booking.findByIdAndUpdate(
                    bookingId,
                    { status: "checked-in" },
                    { new: true }
                ).populate("room customer");
                
                if (!booking) return;

                // Transition room status to checked-in
                if (booking.room) {
                    booking.room.status = "checked-in";
                    await booking.room.save();
                }

                // Inform the specific customer that their check-in is complete
                const customerRoom = booking.customer?._id?.toString();
                if (customerRoom) {
                    io.to(customerRoom).emit("notification", {
                        message: "Your room has been checked in!",
                        bookingId: booking._id,
                        status: "checked-in"
                    });
                }

                // Sync data state modifications with client screens
                io.emit("roomUpdated", booking.room);
                io.to("adminRoom").emit("bookingUpdated", booking);

            } catch (error) {
                console.error("Check-in booking error:", error.message);
            }
        });

        // STEP E: Receptionist checks the guest out of the hotel room
        socket.on("check-out", async (data) => {
            try {
                const { bookingId } = data;
                
                const booking = await Booking.findByIdAndUpdate(
                    bookingId,
                    { status: "checked-out" },
                    { new: true }
                ).populate("room customer");
                
                if (!booking) return;

                // Reset room state so the space can be reserved by new guests
                if (booking.room) {
                    booking.room.status = "available";
                    await booking.room.save();
                }

                // Push final check-out summary message to the guest
                const customerRoom = booking.customer?._id?.toString();
                if (customerRoom) {
                    io.to(customerRoom).emit("notification", {
                        message: "You have been checked-out of your room.",
                        bookingId: booking._id,
                        status: "checked-out"
                    });
                }

                // Broadcast room release data status across app states
                io.emit("roomUpdated", booking.room);
                io.to("adminRoom").emit("bookingUpdated", booking);
                
            } catch (error) {
                console.error("Check-out booking error:", error.message);
            }
        });
    });
};
