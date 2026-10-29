const mongoose=require("mongoose");
const User=require("./user")
const documentSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    filename:{
        type:String,
        required:true
    },

    // how many chunks this document was split into   
    totalChunks:{
        type:Number,
        default:0
    },
    status:{
        type:String,
        enum:["processing","ready","failed"],
        default:"processing"
    }

},{timestamps:true});

module.exports=mongoose.model("Document",documentSchema);