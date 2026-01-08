const fs = require('fs');
const path = require('path');
const axios = require('axios');

const casesPath = path.join(__dirname, 'data/cases.json');
const API_URL = 'http://localhost:3001/api/search';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function populateImages() {
    try {
        let cases = JSON.parse(fs.readFileSync(casesPath, 'utf8'));
        let modified = false;
        let count = 0;

        for (const collection of cases) {
            // Only target the new collections to save time/requests
            if (!['collection-graphic-design-2024', 'collection-sport-field-2024', 'collection-overpass-2024'].includes(collection.id)) {
                continue;
            }

            console.log(`Processing ${collection.name}...`);

            for (const item of collection.items) {
                if (item.image) continue;

                console.log(`Fetching image for: ${item.name}`);
                try {
                    const res = await axios.get(API_URL, { params: { query: item.name } });
                    if (res.data && res.data.success && res.data.results.length > 0) {
                        // Find exact match or best guess
                        const match = res.data.results.find(r => r.hash_name === item.name) || res.data.results[0];

                        if (match && match.asset_description && match.asset_description.icon_url) {
                            item.image = `https://community.cloudflare.steamstatic.com/economy/image/${match.asset_description.icon_url}/360fx360f`;
                            modified = true;
                            count++;
                            console.log(`  -> Found!`);
                        }
                    } else {
                        console.log(`  -> Not found.`);
                    }
                } catch (e) {
                    console.error(`  -> Error fetching: ${e.message}`);
                }

                // Be nice to the server/Steam
                await sleep(5000);
            }
        }

        if (modified) {
            fs.writeFileSync(casesPath, JSON.stringify(cases, null, 2));
            console.log(`\nUpdated ${count} items with new images.`);
        } else {
            console.log('\nNo changes made.');
        }

    } catch (error) {
        console.error('Script error:', error);
    }
}

populateImages();
