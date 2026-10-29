const Groq=require("groq-sdk");

 const groq=new Groq({
    apiKey: process.env.GROQ_API_KEY
});//initialize groq client 


//send context to llm for response
async function askLLM(question,chunks){

    //format chunks into context striing
    const context=chunks.map((chunk,i)=>
        `Source ${i+1} (${chunk.source}) \n${chunk.text}`
    ).join("\n\n");//every chunk get a no. and its source filename
                    //joined with double newline for clear separation of every chunk

    const prompt=`you are a helpful assitant that answers
                questions based only on the provided document context.
                
                
    Context from documnets:
    ${context}
    
    Question: ${question}
    
    Instructions:
    -Answer based only on the context provided above
    -If the answer is not in the context say "I could not find this information in your documents"
    -Be consise and clear
    -Do not mention source names and filenames in your answer
    -Do NOT say "Source 1" or "Source 2" or any filename in your answer
    -Just give the answer directly without referencing where it came from`// //based only on context"prvents AI hallucination"
    //send to qroq
    const response =await groq.chat.completions.create({
        model:"llama-3.1-8b-instant",//8b->8 billion params 8192->context window (how much text it can read)
    
        messages:[
            {
                role:"user",//user=message from human
                content:prompt
            }
        ],

        temperature:0.3,//controls creativeness vs accuracy
        max_tokens:1000//maxm response lenght approx 750 words
    
    
    })
    return response.choices[0].message.content;
      // choices[0] = first response (Groq can return multiple)
    // message.content = the actual text answer
}

module.exports={askLLM};