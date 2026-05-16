const express = require("express");
const {createRoom, getAllRooms, updateRoom, deleteRoom} = require("../controllers/roomController");
const {protect, authorize} = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/", protect, authorize(["admin"]), createRoom);
router.get("/all", protect, getAllRooms);
router.get("/:id", protect, authorize(["admin"]), updateRoom);
router.delete("/:id", protect, authorize(["admin"]), deleteRoom);

module.exports = router;