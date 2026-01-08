const fs = require('fs');
const path = require('path');
const https = require('https');

const casesPath = path.join(__dirname, '../data/cases.json');

const fetchJson = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
};

const TARGET_COLLECTIONS = [
    "The Anubis Collection",
    "The Train 2025 Collection",
    "The Ascent Collection",
    "The Boreal Collection",
    "The Radiant Collection",
    "The 2021 Mirage Collection",
    "The 2021 Train Collection",
    "The 2021 Dust 2 Collection",
    "The 2021 Vertigo Collection",
    "The Havoc Collection",
    "The Control Collection",
    "The Canals Collection",
    "The Norse Collection",
    "The Gods and Monsters Collection",
    "The Rising Sun Collection",
    "The Chop Shop Collection"
];

const run = async () => {
    try {
        console.log("Fetching API data...");
        const apiCollections = await fetchJson('https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/collections.json');
        const apiSkins = await fetchJson('https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json');

        console.log(`Loaded ${apiCollections.length} collections and ${apiSkins.length} skins from API.`);

        let localCases = [];
        if (fs.existsSync(casesPath)) {
            localCases = JSON.parse(fs.readFileSync(casesPath, 'utf8'));
        }

        const existingIds = new Set(localCases.map(c => c.id));
        let addedCount = 0;

        for (const targetName of TARGET_COLLECTIONS) {
            const apiCol = apiCollections.find(c => c.name === targetName);
            if (!apiCol) {
                console.warn(`Warning: Could not find collection '${targetName}' in API.`);
                continue;
            }

            // Create ID (slug)
            // Use API ID or slugify name
            // API ID format: "collection_anubis" -> "collection-anubis"
            let colId = apiCol.id.replace(/_/g, '-');

            if (existingIds.has(colId)) {
                console.log(`Collection '${targetName}' (${colId}) already exists. Skipping.`);
                continue;
            }

            // Find items for this collection
            // Skins have "collections": [ { "id": "...", "name": "..." } ]
            const colItems = apiSkins.filter(skin =>
                skin.collections && skin.collections.some(c => c.id === apiCol.id)
            ).map(skin => ({
                name: skin.name,
                rarity: skin.rarity.name, // "Covert", "Classified" etc.
                image: skin.image // URL
            }));

            // Sort items by rarity? Optional.
            // Map Rarity to Rank for sorting
            const rarityRank = {
                "Contraband": 7,
                "Extraordinary": 6,
                "Covert": 6,
                "Classified": 5,
                "Restricted": 4,
                "Mil-Spec Grade": 3,
                "Industrial Grade": 2,
                "Consumer Grade": 1
            };

            colItems.sort((a, b) => (rarityRank[b.rarity] || 0) - (rarityRank[a.rarity] || 0));

            const newCollection = {
                id: colId,
                name: apiCol.name,
                type: "Collection",
                image: apiCol.image,
                description: `Introduced in Counter-Strike 2`, // Generic description
                items: colItems
            };

            // Add to cases
            localCases.unshift(newCollection);
            existingIds.add(colId);
            addedCount++;
            console.log(`Added '${targetName}' with ${colItems.length} items.`);
        }

        if (addedCount > 0) {
            fs.writeFileSync(casesPath, JSON.stringify(localCases, null, 2));
            console.log(`Successfully added ${addedCount} collections to cases.json.`);
        } else {
            console.log("No new collections added.");
        }

    } catch (error) {
        console.error("Error importing collections:", error);
    }
};

run();
