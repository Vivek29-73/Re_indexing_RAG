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

      chunkHashes:{
        type:[String],
        default:[]
    },

    // fingerprint of the whole document text; if it is identical on re-upload we skip all work
    contentHash:{
        type:String,
        default:""
    },

    // starts at 1 and goes up by 1 every time the document is updated
    version:{
        type:Number,
        default:1
    },
    status:{
        type:String,
        enum:["processing","ready","failed"],
        default:"processing"
    }

},{timestamps:true});

module.exports=mongoose.model("Document",documentSchema);