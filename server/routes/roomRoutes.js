const express = require("express");
const {createRoom, getAllRooms, deleteRoom} = require("../controllers/roomController");
const {protect, authorize} = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/", protect, authorize(["admin"]), createRoom);
router.get("/all", protect, getAllRooms);
router.delete("/:id", protect, authorize(["admin"]), deleteRoom);

module.exports = router;