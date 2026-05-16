const Room = require("../models/Room");

const fs = require("fs");

// STEP 1: Admin creates a new room with a picture upload
exports.createRoom = async (req, res) => {
    try {
        const { roomNumber, roomType, pricePerDay, description } = req.body;
        
        // Check if an image was uploaded by multer
        if (!req.file) {
            return res.status(400).json({
                message: "Room image is required"
            });
        }

        const { path, filename } = req.file;
        
        const room = await Room.create({
            roomNumber,
            roomType,
            pricePerDay,
            description,
            image: {
                path,
                filename
            }
        });

        res.status(201).json({
            message: "Room created successfully",
            room,
        });

        // SOCKET TRIGGER: Tell everyone a new room was added
        const io = req.app.get("io");
        
        if (io) {
            io.emit("roomCreated", room); 
        }

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// STEP 2: Fetch all rooms 
exports.getAllRooms = async (req, res) => {
    try {
        const rooms = await Room.find();
        res.status(200).json({
            message: "Rooms fetched successfully",
            rooms,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// STEP 3: Admin updates existing room data profiles
exports.updateRoom = async (req, res) => {
    try {
        const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
        
    
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        res.status(200).json({
            message: "Room updated successfully",
            room,
        });

        // SOCKET TRIGGER: Tell everyone a room was updated
        const io = req.app.get("io");
        if (io) {
            io.emit("roomUpdated", room); 
        }

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// STEP 4: Admin removes a room from the system and deletes its image file
exports.deleteRoom = async (req, res) => {
    try {
        const room = await Room.findByIdAndDelete(req.params.id);
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        // Deleting the physical image file from the server uploads directory
        if (room.image && room.image.path) {
            // Check if file exists before trying to delete it to prevent unexpected crashes
            if (fs.existsSync(room.image.path)) {
                fs.unlinkSync(room.image.path);
            }
        }

        res.status(200).json({
            message: "Room deleted successfully",
            room,
        });

        // SOCKET TRIGGER: Tell everyone a room was deleted
        const io = req.app.get("io");
        if (io) {
            io.emit("roomDeleted", room); 
        }

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
