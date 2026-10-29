function chunkText(text,filename,chunkSize=500){
    //split chunks into paragraphs much better that split in 500 char blindly
    const paragraphs=text.split(/\n\n+/);

    const chunks=[];
    let currentChunk="";
    let chunkIndex=0;

    for(const paragraph of paragraphs){
        const cleanParagraph=paragraph.trim();//remove whitespace from start and end of para

        if(cleanParagraph.length===0)continue//skips empty paragraphs

        if((currentChunk+cleanParagraph).length<chunkSize){
            currentChunk+=cleanParagraph+" ";

        }else{
             // current chunk is full and push it to chunks array
            // save it if it has enough content
            if(currentChunk.trim().length>50){
                chunks.push({
                    text:currentChunk.trim(),
                    source:filename,
                    chunkIndex:chunkIndex//chunkidx=0,arr 1st idx=0
                })
                chunkIndex++;//chunkidx++->1,2,3
            }
            currentChunk=cleanParagraph+" ";//starts the iteration from last clean paragraph
        }
        }

        //save the last chunk loop ends but last chunk might not be full or currentchunk.length!>800  saved yet
             if(currentChunk.trim().length>50){
                chunks.push({
                    text:currentChunk.trim(),
                    source:filename,
                    chunkIndex:chunkIndex//chunkidx=0,arr 1st idx=0
                })
            }
        return chunks;//return array of chunks containing filename also

    
}

module.exports=chunkText;