const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now()+ "-" + file.originalname)
  }
})

const upload = multer({ storage });

//route 

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
app.use("/uploads", express.static("uploads"));