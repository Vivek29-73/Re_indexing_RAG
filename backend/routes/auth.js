const express=require("express");
const router=express.Router();
const User=require("../models/user");
const { hashPassword, matchPassword, generateToken, cookieOptions }=require("../utils/auth");


//Register
router.post("/register",async(req,res)=>{
    try{
        const {name,email,password}=req.body;

        const existingUser=await User.findOne({email});
        if(existingUser){
         return res.status(400).json({error:"email alredy registered"});   
        }
         
        //use hashPassword fun from utils to hast the pass enterd by user
         const hashedPassword=await hashPassword(password);
    
        //save user to mongodb
        const user=await User.create({
            name,
            email,
            password:hashedPassword
        });

        res.status(201).json({
            success:true,
            message:"registered succesfully please Login"
        });

    } 
    catch(err){
        res.status(500).json({error:err.message});
    }
});

//Login
router.post("/login",async(req,res)=>{
   try{ 
    const {email,password}=req.body;

    const user=await User.findOne({email});
    if(!user){
        return res.status(401).json({error:"invalid email or password"});

    }
    
    //matchpassword fn match the password enterwd by user with
    //stored hashed pass in db by bcrypt.compare()
    const isMatch=await matchPassword(password,user.password);
    if(!isMatch){
        return res.status(401).json({error:"invalid email or password"});
    }

    //token generation for cookies
    const token=generateToken(user._id);
    res.cookie("token",token,cookieOptions);

    res.json({
        success:true,
        user:{id:user._id,name:user.name,email:user.email}
    });
}  catch(err){
    res.status(500).json({error:err.message});
} 

});

//LOGOUT

router.post("/logout",(req,res)=>{
    res.clearCookie("token");

    res.json({success:true,message:"logged out succesfully"});
});


// GET LOGGED IN USER info
router.get("/me", require("../middleware/auth"), async(req, res) => {
    res.json({ user: req.user });
    // returns the currently logged in user's info
    // frontend can call this to check if user is logged in
        
});


module.exports=router;