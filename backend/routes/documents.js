//for all utils to conncet
const express=require("express");
const router=express.Router();
const multer = require("multer")
const protect=require("../middleware/auth");
const Document = require("../models/document");
const {extractText}=require("../utils/extractor");
const {validateDocument}=require("../utils/validator");
const { chunkParagraphs, normalizeText, sha256 } = require("../utils/chunkerParagraph");
const fs=require("fs");
const {embedChunks}=require("../utils/embedder");
const { storeChunks, deleteDocumentChunks, storeDocumentVector, deleteDocumentVector, searchDocuments, getChunkVectors, deleteChunksByHashes } = require("../utils/vectorDB")
const { generateEmbeddings } = require("../utils/embedder")
const { validateQuery } = require("../utils/validator")
//multer setup
const upload=multer({
    dest:"uploads/",
    limits:{
        fileSize:10*1024*1024,//10 mb limit 
        files:10
    }//dest:uploads will save file temporary 
    //runs before router so that all files are stored before route calling
})

//UPLOAD route

router.post("/upload",protect,upload.array("documents",10),async(req,res)=>{
    try{
        const files=req.files;
        const userId=req.user._id.toString();

        console.log(`uplaod from userid${userId} and files are ${files ? files.length:0} `)
         
        if(!files || files.length===0){
            return res.status(400).json({error: "no files uploaded"});
        }
        const results=[];
        const errors=[];

        //process each file one by one
   
        for(const file of files){

            try{
                //for taking rest time by the minilmv2 embeeder for another file
         await new Promise(resolve=>setTimeout(resolve,500))

                const extracted=await extractText(file);
              
                validateDocument(extracted.text);

                const doc=await Document.create({
                    userId:userId,
                    filename:extracted.filename,
                    status:"processing"
                })

          const chunks=chunkParagraphs(extracted.text,extracted.filename);

                const embeddedChunks=await embedChunks(chunks);

                await storeChunks(embeddedChunks,userId,doc._id.toString());
                
                // stores ONE vector representing whole document
                   await storeDocumentVector(
                    userId,
                    doc._id.toString(),
                    extracted.filename,
                    embeddedChunks
                )

                await Document.findByIdAndUpdate(doc._id,{
                    status:"ready",
                    totalChunks:chunks.length,
                    chunkHashes:chunks.map(c=>c.hash),
                    contentHash:sha256(normalizeText(extracted.text)),
                    version:1
                })

                results.push({
                    filename:extracted.filename,
                    totalChunks:chunks.length,
                    status:"success"
                })
            }catch(fileError){//of one file fail ,continue other files processing
                errors.push({
                    filename:file.originalname,
                    error:fileError.message
                })
                
            }
            
        }
        res.json({
            success:true,
            processed:results,
            failed:errors,
            message: `${results.length} files uploaded, ${errors.length} failed`
        })
    }catch(err){
        res.status(500).json({error: err.message})
    }
});

// SEARCH DOCUMENTS ROUTE 
router.post("/search", protect, async(req, res) => {
    try {
        const { query } = req.body
        const userId = req.user._id.toString()

        if(!query || query.trim().length === 0) {
            return res.status(400).json({ error: "please enter a search query" })
        }

        //validate query
        const cleanQuery = validateQuery(query)

        // convert query to vector
        const queryVector = await generateEmbeddings(cleanQuery)
    
      // search document_index collection
        const topDocuments = await searchDocuments(queryVector, userId, 5)
        // not chunks — whole documents
        // filtered by userId

        if(topDocuments.length === 0) {
            return res.json({
                documents: [],
                message: "no relevant documents found. please upload documents first"
            })
        }

        res.json({
            documents: topDocuments
            // returns array of:
            // { documentId, filename, totalChunks, score }
        })

    } catch(err) {
        res.status(500).json({ error: err.message })
    }
})



router.get("/my-documents", protect, async(req, res) => {
    try {
      

        const docs = await Document.find({
            userId: req.user._id,
            status: "ready"
            // only return documents that finished processing
            // processing or failed documents not shown
        }).sort({ createdAt: -1 })
        // sort newest first
        // -1 means descending order

        

        res.json({ documents: docs })

    } catch(err) {
        console.log("get documents error:", err.message)
        res.status(500).json({ error: err.message })
    }
});




// DELETE A DOCUMENT
router.delete("/:documentId", protect, async(req, res) => {
    try {
        const documentId = req.params.documentId
        // req.params.documentId gets the ID from the URL
        // example URL: DELETE /api/documents/64abc123
       
       

        // find document in MongoDB
        const doc = await Document.findById(documentId)
        if(!doc){
            return res.status(404).json({ error: "document not found" })
        }

        // verify this document belongs to logged in user
        if(doc.userId.toString() !== req.user._id.toString()){
            return res.status(403).json({ error: "not authorized" })

            // prevents user A deleting user B's documents
        }

        // delete chunks from Qdrant first
        await deleteDocumentChunks(documentId)

      // delete document vector from Qdrant 
        await deleteDocumentVector(documentId)//if not delete both doc and chunk vector,still show result relate to iyyt
      

        // then delete record from MongoDB
        await Document.findByIdAndDelete(documentId)
        

        res.json({ success: true, message: "document deleted" })

    } catch(err) {
        
        res.status(500).json({ error: err.message })
    }
})

// UPDATE A DOCUMENT (incremental re-index): only changed chunks are embedded
router.put("/:documentId/update", protect, upload.single("document"), async(req, res) => {
    const file = req.file
    const documentId = req.params.documentId
    let locked = false
    const startedAt = Date.now()

    try {
        if(!file){
            return res.status(400).json({ error: "no file uploaded" })
        }

        const userId = req.user._id.toString()

        const existing = await Document.findById(documentId)
        if(!existing){
            return res.status(404).json({ error: "document not found" })
        }
        if(existing.userId.toString() !== userId){
            return res.status(403).json({ error: "not authorized" })
        }
        if(existing.chunkHashes.length === 0){
            return res.status(400).json({
                error: "this document was uploaded before incremental indexing existed. delete it and upload it again once."
            })
        }

        // LOCK: only one update at a time. If someone else changed it, this returns null
        const doc = await Document.findOneAndUpdate(
            { _id: documentId, status: "ready", version: existing.version },
            { status: "processing" }
        )
        if(!doc){
            return res.status(409).json({ error: "document is being updated or was just changed, try again" })
        }
        locked = true

        const extracted = await extractText(file)
        validateDocument(extracted.text)

        // whole document identical? then nothing to do
        const newContentHash = sha256(normalizeText(extracted.text))
        if(newContentHash === doc.contentHash){
            await Document.findByIdAndUpdate(documentId, { status: "ready" })
            locked = false
            return res.json({ success: true, unchanged: true, message: "document is identical, nothing to update" })
        }

        // 1. chunk the new text and fingerprint every chunk
        const newChunks = chunkParagraphs(extracted.text, doc.filename)
        const newHashes = newChunks.map(c => c.hash)
        const oldHashes = doc.chunkHashes
        const oldSet = new Set(oldHashes)
        const newSet = new Set(newHashes)

        // 2. chunks whose fingerprint we already had: fetch their stored vectors (no embedding)
        const keptHashes = newHashes.filter(h => oldSet.has(h))
        const reusedVectors = await getChunkVectors(documentId, keptHashes)

        // 3. embed ONLY chunks that have no reusable vector
        //    (this also repairs any chunk that is missing from Qdrant)
        const toEmbed = newChunks.filter(c => !reusedVectors.has(c.hash))
        const embeddedNew = await embedChunks(toEmbed)

        // 4. INSERT new vectors first (same chunk = same ID, so retrying is safe)
        if(embeddedNew.length > 0){
            await storeChunks(embeddedNew, userId, documentId)
        }

        // 5. document-level vector = average of ALL chunk vectors (reused + new)
        const freshVectors = new Map(embeddedNew.map(c => [c.hash, c.vector]))
        const allChunks = newChunks.map(c => ({
            vector: reusedVectors.get(c.hash) || freshVectors.get(c.hash)
        }))
        await storeDocumentVector(userId, documentId, doc.filename, allChunks)

        // 6. DELETE outdated chunks last, so search never has a gap
        const staleHashes = oldHashes.filter(h => !newSet.has(h))
        await deleteChunksByHashes(documentId, staleHashes)

        // 7. COMMIT: only now does MongoDB record the new state
        await Document.findByIdAndUpdate(documentId, {
            status: "ready",
            totalChunks: newChunks.length,
            chunkHashes: newHashes,
            contentHash: newContentHash,
            version: doc.version + 1
        })
        locked = false

        res.json({
            success: true,
            version: doc.version + 1,
            stats: {
                totalChunks: newChunks.length,
                reusedChunks: reusedVectors.size,
                embeddedChunks: embeddedNew.length,
                deletedChunks: staleHashes.length,
                timeMs: Date.now() - startedAt
            }
        })

    } catch(err) {
        // old state is still recorded in MongoDB, so just unlock and let the user retry
        if(locked){
            await Document.findByIdAndUpdate(documentId, { status: "ready" }).catch(() => {})
        }
        res.status(500).json({ error: err.message })
    } finally {
        try { if(file && fs.existsSync(file.path)) fs.unlinkSync(file.path) } catch(e) {}
    }
})

module.exports = router
