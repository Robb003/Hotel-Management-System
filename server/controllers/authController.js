const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

//signup logic

exports.Signup = async(req, res)=>{
    try{
        const {name, email, password, phoneNumber, idNumber} = req.body;
        const exist = await User.findOne({email});
        if(exist){
            return res.status(400).json({message: "User already exist"});
        };
        const  hashed = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email,
            password: hashed,
            phoneNumber,
            idNumber,
            role: "customer"
        });
        const token = jwt.sign({id: user._id, role: user.role}, process.env.JWT_SECRET, {expiresIn: "7d"});
        res.status(201).json({
            message: "user created successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                role: user.role
            }
        });

    } catch (error){
        res.status(500).json({message: error.message});
    };
};

//login logic

exports.Login = async(req, res) =>{
    try {
    const {email, password} = req.body;
    const user = await User.findOne({email});
    if(!user){
        return res.status(404).json({message: "user not found"});
    };
    const match = await bcrypt.compare(password, user.password);
    if(!match){
        return res.status(401).json({message: "incorrect password"});
    };
    const token = jwt.sign({id: user._id, role: user.role}, process.env.JWT_SECRET, {expiresIn: "7d"});
        res.status(200).json({
            message: "login successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                role: user.role
            }
        });

    } catch(error) {
        res.status(500).json({message: error.message});
    };
};
