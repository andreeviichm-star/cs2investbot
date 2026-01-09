const fs = require('fs');
const path = require('path');
const axios = require('axios'); // Added axios

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


// Map for O(1) icon lookup by market hash name
// Populated after load AND external fetch
const iconMap = new Map();
if (localCases.length > 0) {
    localCases.forEach(collection => {
        // Index the container itself
        if (collection.name && collection.image) {
            iconMap.set(collection.name, collection.image);
        }

        // Index items inside
        if (collection.items) {
            collection.items.forEach(item => {
                iconMap.set(item.name, item.image);
            });
        }
    });
}

// Fetch External Image Databases (ByMykel)
const fetchExternalImages = async () => {
    try {
        console.log('[WikiScraper] Fetching external image databases...');
        const [skinsRes, cratesRes, stickersRes] = await Promise.all([
            axios.get('https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json'),
            axios.get('https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/crates.json'),
            axios.get('https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/stickers.json')
        ]);

        let count = 0;

        // Helper to add
        const add = (items) => {
            if (Array.isArray(items)) {
                items.forEach(item => {
                    if (item.name && item.image) {
                        iconMap.set(item.name, item.image);
                        count++;
                    }
                });
            }
        };

        add(skinsRes.data);
        add(cratesRes.data);
        add(stickersRes.data);

        console.log(`[WikiScraper] Loaded ${count} external images.`);

    } catch (e) {
        console.error('[WikiScraper] Failed to fetch external images:', e.message);
    }
};

// Start fetching immediately/async & export promise
const imageLoadingPromise = fetchExternalImages();

const scrapeCases = async () => {
    if (localCases.length > 0) {
        return localCases.map(c => ({
            id: c.id,
            name: c.name,
            image: c.image,
            type: c.type,
            url: `/cases/${c.id}`
        }));
    }
    return [];
};

const scrapeCollection = async (collectionId) => {
    const local = localCasesMap.get(collectionId);
    if (local) return local;
    return null;
}

const searchLocalItems = (query) => {
    if (!query || query.length < 3) return [];

    let lowerQuery = query.toLowerCase();

    // Russian Mapping
    const RU_MAPPING = {
        'кейс': 'case', 'коллекция': 'collection', 'капсула': 'capsule',
        'наклейка': 'sticker', 'сувенир': 'souvenir', 'набор': 'package',
        'перчатки': 'gloves', 'нож': 'knife', 'авп': 'awp',
        'калаш': 'ak-47', 'эмка': 'm4a', 'юсп': 'usp',
        'глок': 'glock', 'дигл': 'desert eagle'
    };

    for (const [ru, en] of Object.entries(RU_MAPPING)) {
        if (lowerQuery.includes(ru)) lowerQuery = lowerQuery.replace(ru, en);
    }

    const results = [];
    const seenNames = new Set();

    for (const collection of localCases) {
        if (!collection.items) continue;
        for (const item of collection.items) {
            if (seenNames.has(item.name)) continue;
            if (item.name.toLowerCase().includes(lowerQuery)) {
                results.push({
                    hash_name: item.name,
                    asset_description: {
                        icon_url: item.image
                    }
                });
                seenNames.add(item.name);
                if (results.length >= 20) return results;
            }
        }
    }
    return results;
};

const getIcon = (marketHashName) => {
    // 1. Exact Match
    if (iconMap.has(marketHashName)) return iconMap.get(marketHashName);

    // 2. Fuzzy Match
    let cleanName = marketHashName
        .replace(/^★\s?/, '')
        .replace(/^(StatTrak™|Souvenir)\s?/, '')
        .replace(/\s\([^)]+\)$/, '')
        .trim();

    if (iconMap.has(cleanName)) return iconMap.get(cleanName);

    return null;
};

module.exports = { scrapeCases, scrapeCollection, searchLocalItems, getIcon, imageLoadingPromise };
