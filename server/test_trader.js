const axios = require('axios');

async function debug() {
    try {
        console.log("Fetching prices from CSGO Trader...");
        // This file is big, so maybe stream it or just fetch.
        // It's JSON object where keys are Item Names.
        const res = await axios.get('https://prices.csgotrader.net/latest/prices_v6.json');

        const data = res.data;
        const check = ['Revolution Case', 'AK-47 | Redline (Field-Tested)', 'Dreams & Nightmares Case'];

        console.log("\n--- Price Check ---");
        check.forEach(name => {
            const item = data[name];
            if (item) {
                console.log(`\n[${name}]`);
                console.log(`  Steam: $${item.steam.last_24h}`);
                console.log(`  Steam (7d): $${item.steam.last_7d}`);
                console.log(`  Buff163: $${item.buff163?.starting_at}`);
                console.log(`  Skinport: $${item.skinport?.starting_at}`);
            } else {
                console.log(`\n[${name}] NOT FOUND`);
            }
        });

    } catch (e) {
        console.error(e.message);
    }
}

debug();
