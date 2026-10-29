//this file has protect middleware used for token verify 
//in cookies for each req after login

const jwt=require("jsonwebtoken");
const User=require("../models/user");

async function protect(req,res,next){
    const token=req.cookies.token;

    if(!token){
        return res.status(401).json({error:"please login first"});
    }

    //checks token signature using JWT_SECRET
    //extracts userid that was stored inside token
    const decoded=jwt.verify(token,process.env.JWT_SECRET);
    
    // find user in MongoDB using the userId from token
    const user=await User.findById(decoded.userId).select("-password");
    // finds user by their MongoDB ID ansd
    // .select("-password") means return everything EXCEPT password
    //which will store in user as findBY get all properties of user fro db
        
    req.user=user;

     //now every route after this middleware
    //can access req.user to know who is logged in
    //req.user._id gives the userId

    next();
}

module.exports=protect;