const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Mock load of cases.json for mapping check
const CASES_FILE = path.join(__dirname, 'data/cases.json');
let localCases = [];
let localNames = new Set();

try {
    if (fs.existsSync(CASES_FILE)) {
        const raw = fs.readFileSync(CASES_FILE, 'utf-8');
        localCases = JSON.parse(raw);
        localCases.forEach(c => {
            if (c.items) c.items.forEach(i => localNames.add(i.name));
        });
        console.log(`Loaded ${localNames.size} local item names.`);
    }
} catch (e) {
    console.error("Failed to load local cases:", e);
}

async function debugSkinport() {
    try {
        console.log("Fetching Skinport items...");
        const res = await axios.get('https://api.skinport.com/v1/items', {
            params: {
                app_id: 730,
                currency: 'USD',
                tradable: 0
            },
            headers: { 'Accept-Encoding': 'br' }
        });

        const items = res.data;
        console.log(`Skinport returned ${items.length} items.`);

        // 1. Check for "Fever Case"
        const fever = items.filter(i => i.market_hash_name.toLowerCase().includes('fever case'));
        console.log("Fever Case matches:", fever.map(i => i.market_hash_name));

        // 2. Check overlap with Local Data (for icons)
        let matches = 0;
        const sampleMisses = [];
        items.slice(0, 1000).forEach(i => {
            if (localNames.has(i.market_hash_name)) {
                matches++;
            } else {
                if (sampleMisses.length < 5) sampleMisses.push(i.market_hash_name);
            }
        });
        console.log(`Icon Match Rate (Sample 1000): ${matches}/1000`);
        console.log("Sample Misses (No Icon):", sampleMisses);

    } catch (e) {
        console.error("Error:", e.message);
    }
}

debugSkinport();
