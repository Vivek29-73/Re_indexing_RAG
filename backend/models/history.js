const mongoose=require ("mongoose");

const historySchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,//links to user collection
        ref:"User",//this id belongs to this user
        required:true
    },

    question:{
        type:String,
        required:true
    },

     answer:{
        type:String,
        required:true
    },
    sources:[
        {
            filename:String,
            score:Number,
        },
    ],

},{timestamps:true});

module.exports=mongoose.model("History",historySchema);