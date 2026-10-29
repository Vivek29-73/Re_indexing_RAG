const { pipeline } = require("@xenova/transformers")

let embedder = null


async function getEmbedder() {
    // if embedder already loaded return it directly
    if(embedder){
      
        return embedder
    }

 
    embedder = await pipeline(
        "feature-extraction",
        // feature-extraction = convert text to vector
        "Xenova/all-MiniLM-L6-v2"
    )
    return embedder
}


async function generateEmbeddings(text) {

    // get model (loads first time, cached after)
    const embed = await getEmbedder()

    const result = await embed(text, {
        pooling: "mean",
        // pooling = how to combine all token vectors
             // into one single vector
        normalize: true
        // normalize = scale vector values between -1 and 1
        
    })

    const vector = Array.from(result.data)
    // should always print 384

    return vector
}


//loops through each chunk and embeds each one
async function embedChunks(chunks){

   
    const embeddedChunks=[];

    for(const chunk of chunks){
        
        //send chunk text to get its vector
        const vector=await generateEmbeddings(chunk.text);//if use promise and map the chunks ,good for large docs
                                                        //then it will give all embedding for chunk at once 
                                                        //this may be used if there are like modre(50-100)chunks
                                                        //so each chunk line by line takes some extar time so use 
                                                        //use promise,send req simultanusly,wait for all to finishreturn all at once

        //add this vector to chunk object
        embeddedChunks.push({
            text:chunk.text,
            source:chunk.source,
            chunkIndex:chunk.chunkIndex,
            vector:vector
            // everything same as before
            // just vector added on top
        })

        //for taking rest time by the minilmv2 embeeder for another file
         await new Promise(resolve=>setTimeout(resolve,500))
    }

    return embeddedChunks;// same array as input but each chunk now has vector

}

module.exports={generateEmbeddings,embedChunks};