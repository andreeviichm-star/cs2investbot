const fs = require('fs');
const path = require('path');

const CASES_FILE = path.join(__dirname, '../data/cases.json');

// Memory Cache for Local Data
let localCases = [];
let localCasesMap = new Map();

// Load Local Data on Startup
try {
    if (fs.existsSync(CASES_FILE)) {
        const raw = fs.readFileSync(CASES_FILE, 'utf-8');
        localCases = JSON.parse(raw);
        localCases.forEach(c => localCasesMap.set(c.id, c));
        console.log(`[WikiScraper] Loaded ${localCases.length} cases/collections from localDB.`);
    } else {
        console.warn("[WikiScraper] Local cases.json not found!");
    }
} catch (e) {
    console.error("[WikiScraper] Failed to load local cases:", e);
}


let casesCache = { data: null, timestamp: 0 };
let collectionsCache = new Map(); // id -> { data, timestamp }

const scrapeCases = async () => {
    // Priority: Local Data
    // Since scraping is blocked, we rely on local data 100% for the list.
    if (localCases.length > 0) {
        // Return simplified list for the overview
        return localCases.map(c => ({
            id: c.id,
            name: c.name,
            image: c.image,
            type: c.type,
            url: `/cases/${c.id}`
        }));
    }

    // Fallback? If local is empty invoke scraper (likely fail)
    return [];
};

const scrapeCollection = async (collectionId) => {
    // 1. Try Local Data
    const local = localCasesMap.get(collectionId);
    if (local) {
        return local;
    }

    // 2. Try partial match in local? (e.g. if ID format differs)
    // process_data.js saved IDs like "crate-4001", but frontend might request "revolution-case"
    // My raw data has IDs like "crate-XXXX". The user's frontend requests slugs like "revolution-case".
    // I NEED TO MAP THEM. Or checking name match. 

    // The "id" in my processed data is "crate-XXXX".
    // The "id" in my old fallback was "revolution_case".
    // The frontend uses what verify_wiki returned.

    // Issue: The frontend is built to request IDs that it got from `scrapeCases`.
    // If `scrapeCases` returns IDs like "crate-4001", then frontend will ask for "crate-4001".
    // So if I return localCases in scrapeCases, the IDs will be consistent.
    // The only issue is if the user hardcoded some IDs in frontend?
    // No, Overview.jsx iterates over `wikiCases`.

    // So as long as scrapeCases returns the IDs from cases.json, scrapeCollection receiving those IDs will work.

    return null;
}

const searchLocalItems = (query) => {
    if (!query || query.length < 3) return [];

    let lowerQuery = query.toLowerCase();

    // Russian Mapping for better local search
    const RU_MAPPING = {
        'кейс': 'case',
        'коллекция': 'collection',
        'капсула': 'capsule',
        'наклейка': 'sticker',
        'сувенир': 'souvenir',
        'набор': 'package',
        'перчатки': 'gloves',
        'нож': 'knife',
        'авп': 'awp',
        'калаш': 'ak-47',
        'эмка': 'm4a',
        'юсп': 'usp',
        'глок': 'glock',
        'дигл': 'desert eagle'
    };

    // Replace known Russian terms with English equivalents
    for (const [ru, en] of Object.entries(RU_MAPPING)) {
        if (lowerQuery.includes(ru)) {
            lowerQuery = lowerQuery.replace(ru, en);
        }
    }

    const results = [];
    const seenNames = new Set();

    // Iterate all collections/cases
    for (const collection of localCases) {
        if (!collection.items) continue;

        for (const item of collection.items) {
            if (seenNames.has(item.name)) continue;

            if (item.name.toLowerCase().includes(lowerQuery)) {
                results.push({
                    hash_name: item.name,
                    asset_description: {
                        icon_url: item.image // Wiki data uses 'image' key, we need to map to Steam format if possible or handle in frontend
                    }
                });
                seenNames.add(item.name);

                if (results.length >= 20) return results; // Limit results
            }
        }
    }
    return results;
};

module.exports = { scrapeCases, scrapeCollection, searchLocalItems };
