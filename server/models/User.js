const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true, trim: true, lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please fill a valid email address"]
    },
    password: {type: String, required: true,  minlength: [8, "password must be eigth characters long"]},
    phoneNumber: {type: String, required: true, trim: true, 
         match: [
            /^(?:\+254|254)[17]\d{8}$/,
            "Phone number must be in format 2547XXXXXXXX or +2547XXXXXXXX"
        ]
    },
    idNumber: {type: Number, required: true, unique: true},
    role: {type: String, required: true, enum: ["admin", "customer", "receptionist"], default: "customer"}
    
}, {
    timestamps: true
   }
);

module.exports = mongoose.model("User", userSchema);