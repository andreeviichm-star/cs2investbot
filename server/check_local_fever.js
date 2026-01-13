const fs = require('fs');
const path = require('path');
const CASES_FILE = path.join(__dirname, 'data/cases.json');
const raw = fs.readFileSync(CASES_FILE, 'utf-8');
const localCases = JSON.parse(raw);

console.log("Checking for Fever Case...");
const caseFound = localCases.find(c => c.name === 'Fever Case' || c.name.includes('Fever'));
if (caseFound) {
    console.log("Found Container:", caseFound.name);
    console.log("Image:", caseFound.image);
} else {
    console.log("Not found in containers.");
}

console.log("Checking items inside...");
let itemFound = false;
localCases.forEach(c => {
    if (c.items) {
        const i = c.items.find(it => it.name === 'Fever Case');
        if (i) {
            console.log("Found as Item in:", c.name);
            itemFound = true;
        }
    }
});
if (!itemFound) console.log("Not found as item.");
