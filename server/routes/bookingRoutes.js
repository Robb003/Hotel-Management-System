const express = require("express");
const{createBooking, getAllBookings, getMyBookings, acceptBooking, rejectBooking, checkIn, checkOut } = require("../controllers/bookingController");
const { authorize, protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/", protect, authorize(["customer"]), createBooking);
router.get("/all", protect, authorize(["admin", "receptionist"]), getAllBookings);
router.get("/me", protect, authorize(["customer"]), getMyBookings);
router.put("/:id/accept", protect, authorize(["admin"]), acceptBooking);
router.put("/:id/reject", protect, authorize(["admin"]), rejectBooking);
router.put("/:id/checkin", protect, authorize(["receptionist"]), checkIn);
router.put("/:id/checkout", protect, authorize(["receptionist"]), checkOut);

module.exports = router;
