require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const multer = require("multer");
const connectDB = require("./config/db");
const {Server} = require("socket.io");
const Room = require("./models/Room"); // Ensure Room model is imported

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*"}
});

app.set("io", io);

// socket io
require('./socket/index')(io); 

// images storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

// middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.post("/single", upload.single("image"), async(req, res)=>{
    try {
        const {roomNumber, roomType, pricePerDay, description} = req.body;
        if(!req.file) return res.status(400).send({"error": "No image uploaded"});
        
        const {path, filename} = req.file;
        const room = new Room({
            roomNumber,
            roomType,
            pricePerDay,
            description,
            image: { path, filename }
        });
        await room.save();
        res.send({"msg":"image uploaded", room});
    } catch(error){
        res.status(500).send({"error" : "unable to upload image: " + error.message});
    }
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));

app.use("/api/rooms", require("./routes/roomRoutes")(upload)); 

// DB & START
connectDB();
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));

