const express = require("express");
const {createRoom, getAllRooms, updateRoom, deleteRoom} = require("../controllers/roomController");
const {protect, authorize} = require("../middleware/authMiddleware");
const router = express.Router();

module.exports=(upload)=>{
    
router.post("/", protect, authorize(["admin"]), upload.single("image"), createRoom);
router.get("/all", protect, getAllRooms);
router.put("/:id", protect, authorize(["admin"]), updateRoom);
router.delete("/:id", protect, authorize(["admin"]), deleteRoom);
return router;
}