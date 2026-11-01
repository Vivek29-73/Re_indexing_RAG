const crypto = require("crypto");

const MIN_CHARS = 100;   // shorter than this -> merge with the NEXT paragraph (once)
const MAX_CHARS = 1000;  // longer than this -> split by sentences

function normalizeText(text) {
    return text.replace(/\s+/g, " ").trim();
}

function sha256(text) {
    return crypto.createHash("sha256").update(text).digest("hex");
}

function splitLongParagraph(paragraph) {
    const sentences = paragraph.split(/(?<=[.!?])\s+/);
    const pieces = [];
    let current = "";

    for (const sentence of sentences) {
        if (sentence.length > MAX_CHARS) {
            if (current) { pieces.push(current); current = ""; }
            let part = "";
            for (const word of sentence.split(" ")) {
                if ((part + " " + word).trim().length > MAX_CHARS) {
                    pieces.push(part);
                    part = word;
                } else {
                    part = (part + " " + word).trim();
                }
            }
            if (part) pieces.push(part);
        } else if ((current + " " + sentence).trim().length > MAX_CHARS) {
            pieces.push(current);
            current = sentence;
        } else {
            current = (current + " " + sentence).trim();
        }
    }
    if (current) pieces.push(current);
    return pieces;
}

// split raw text into paragraphs.
// 1) blank lines always separate paragraphs.
// 2) many PDFs have NO blank lines, only line breaks, so inside a block we also
//    start a new paragraph after any line that ends a sentence (. ! ? or :).
function splitIntoParagraphs(rawText) {
    const blocks = rawText.replace(/\r\n/g, "\n").split(/\n\s*\n/)
    const paragraphs = []
    for (const block of blocks) {
        let current = []
        for (const line of block.split("\n")) {
            current.push(line)
            if (/[.!?:]["')\]]?\s*$/.test(line)) {
                paragraphs.push(current.join(" "))
                current = []
            }
        }
        if (current.length > 0) paragraphs.push(current.join(" "))
    }
    return paragraphs.map(normalizeText).filter(p => p.length > 0)
}

function chunkParagraphs(rawText, filename) {
        const paragraphs = splitIntoParagraphs(rawText);

    const units = [];
    for (const p of paragraphs) {
        if (p.length > MAX_CHARS) units.push(...splitLongParagraph(p));
        else units.push(p);
    }

    const texts = [];
    for (let i = 0; i < units.length; i++) {
        if (units[i].length < MIN_CHARS && i + 1 < units.length) {
            texts.push(units[i] + " " + units[i + 1]);
            i++;
        } else {
            texts.push(units[i]);
        }
    }

    const seen = new Map();
    return texts.map((text, index) => {
        const occurrence = seen.get(text) || 0;
        seen.set(text, occurrence + 1);
        return {
            text,
            source: filename,
            chunkIndex: index,
            hash: sha256(text + "#" + occurrence)
        };
    });
}

module.exports = { chunkParagraphs, normalizeText, sha256 };