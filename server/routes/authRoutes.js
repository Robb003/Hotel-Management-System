const express = require("express");
const {Signup, Login} = require("../controllers/authController");
const router = express.Router();

router.post("/signup", Signup);
router.post("/login", Login);

module.exports = router;