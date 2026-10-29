// receives the raw text from extractor
function validateDocument(text){

    if(!text || text.trim().length===0){
        throw new Error("documnet is empty or unreadable");
    }
    // trim() removes whitespace from start and end
    // if after trimming the length is 0 the document
    if(text.length<100){
        throw new Error("document has too little content");
        }
     //check for hiiden instructions and prompt injectoio or data poisoning
    const dangerousPatterns=[
        /ignore previous instructions/i,
        /ignore all instructions/i,
        /you are now/i,
        /forget everything/i,
        /new instructions/i,
        /system prompts/i,
        /reveal your/i,
//     /pattern/i means case insensitive check
    ]   
    
    for(const pattern of dangerousPatterns){
        if(pattern.test(text)){
            throw new Error ("document contains suspicious content");
        }
    }

    return true;
}
//to validate questions or query
function validateQuery(question){
    if(!question || question.trim().length===0){
        throw new Error("please enter a question");
    }

    if(question.trim().length<3){
        throw new error("question is too short");
    }
    if(question.length>500){
        throw new Error ("Question is too long")
    }

    //check for prompt injections
    const dangerousPatterns=[
        /ignore previous instructions/i,
        /ignore all instructions/i,
        /forget everything/i,
        /reveal your system prompt/i,
        /bypass your rules/i,
    ]

    for(const pattern of dangerousPatterns){
        if(pattern.test(question)){
            throw new Error("question contains invalid content");
        }
    }
    return question.trim().replace(/\s+/g," ")
    // replace(/\s+/g, " ") replaces multiple spaces with single spac

}

module.exports={validateDocument,validateQuery};























