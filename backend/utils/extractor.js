const fs=require("fs");
const pdf=require("pdf-parse");

async function extractText(file){
    if(file.mimetype!=="application/pdf"){
        throw new Error("only Pdf files are allowed");
    }
     // file.path is where multer saved the file temporarily
    // fs.readFileSync reads the file as a buffer (raw bytes)
    const dataBuffer=fs.readFileSync(file.path)
     
    const data=await pdf(dataBuffer);
    // data.text contains all the text from the PDF

    fs.unlinkSync(file.path);//deletes the temp file in uploads folder

    return{
        text:data.text,
        filename:file.originalname
    }

} 

module.exports={extractText};