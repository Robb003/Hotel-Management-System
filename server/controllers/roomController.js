const Room = require("../models/Room");
const fs = requiire("fs")

exports.createRoom = async(req, res)=>{
    try {
        const {roomNumber, roomType, pricePerDay, description} = req.body;
        // get uploaded image
        
        if (!req.file) {
            return res.status(400).json({
                message: "Room image is required"
            });
        };
        const {path, filename} = req.file;
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
            message: "room created succefully",
            room,
        });
        // SOCKET TRIGGER: Tell everyone a new room was added
        const io = req.app.get("io");
        io.emit("roomCreated", room); 

    } catch(error){
        res.status(500).json({message: error.message});
    }
};

exports.getAllRooms = async(req, res)=>{
    try{
        const rooms = await Room.find();
        res.status(200).json({
            message: "rooms fetched successfully",
            rooms,
        });
    } catch(error){
        res.status(500).json({message: error.message});
    }
};

exports.updateRoom = async(req, res)=>{
    try {
        const room = await Room.findByIdAndUpdate(req.params.id, req.body,{new: true});
        if(room){
            return res.status(404).json({message: "room not found"});
        };
        res.status(200).json({
            message: "room updated succefully",
            room,
        });
        // SOCKET TRIGGER: Tell everyone a room was updated
        const io = req.app.get("io");
        io.emit("roomUpdated", room); 

    } catch(error){
        res.status(500).json({message: error.message});
    }
};

exports.deleteRoom = async(req, res)=>{
    try{
        const room = await Room.findByIdAndDelete(req.params.id);
        if(!room){
            return res.status(404).json({message: "room not found"});
        };
//deleting the image
         if (room.image?.path) {
            fs.unlinkSync(room.image.path);
        };
        res.status(200).json({
            message: "room deleted successfully",
            room,
        });

        // SOCKET TRIGGER: Tell everyone a room was deleted
        const io = req.app.get("io");
        io.emit("roomDeleted", room); 

    } catch(error){
        res.status(500).json({message: error.message});
    }
};