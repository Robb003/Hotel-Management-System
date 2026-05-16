require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const multer = require("multer");
const connectDB = require("./config/db");
const {Server} = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server (server, {
    cors: { origin: "*"}
});

//socket io
require('./socket')(io);

//images

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now()+ "-" + file.originalname);
  }
});

const upload = multer({ storage });

//middleware
app.use(cors());
app.use(express.json());

app.post("/single", upload.single("image"), async(req, res)=>{
    try {
        const {roomNumber, roomType, pricePerDay, description} = req.body;
        const {path, filename} = req.file;
        const room = new RoomModel({
            roomNumber,
            roomType,
            pricePerDay,
            description,
            images: [{
                path,
                filename,
            }]
        });
        await room.save();
        res.send({"msg":"image uploaded"});
    } catch(error){
        res.send({"error" : "unable to upload image"});
    }
});

//routes

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/bookingRoutes", require("./routes/bookRoutes"));
app.use("/api/roomRoutes", require("./routes/roomRouts"));


app.use("/uploads", express.static("uploads"));

//DB &START

connectDB ();
const PORT = process.env.PORT || 5000;
server.listen(PORT, ()=> console.log(`Server is running on  http://localhost:${PORT}`));
