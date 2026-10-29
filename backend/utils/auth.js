//this file has functions like hashpass(),generateTokenn(),etc 
// to get exported to other file

const jwt=require("jsonwebtoken");
const bcrypt=require("bcryptjs");

//hash the password
async function hashPassword(password){
    const hashed=await bcrypt.hash(password,10);//10 =salt rounds(like complexity)
    return hashed;
}

//  compares plain or entered password with hashed version
async function matchPassword(enteredPassword,storedHash){
    const isMatch=await bcrypt.compare(enteredPassword,storedHash);
    return isMatch;
}

//created a JWT token
//creates a small digital passport containing userId
//  stored  in cookie

function generateToken(userId){
    const token=jwt.sign(
        {userId:userId},
        process.env.JWT_SECRET,
        {expiresIn:"7d"}
    );
    return token;
}

//cookies settings
const cookieOptions={
httpOnly:true,
secure:false,//works on http
maxAge:7*24*60*60*1000 //lives for 7days
}

module.exports={
    hashPassword,
    matchPassword,
    generateToken,
    cookieOptions
}
//auth route will imprt all this above 4 function used in Register and Login fn