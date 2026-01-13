const axios = require('axios');

async function testByMykel() {
    try {
        console.log("Fetching ByMykel/CSGO-API skins.json...");
        const res = await axios.get('https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json');

        const skins = res.data; // Object or Array?
        if (Array.isArray(skins)) {
            console.log("Skins count:", skins.length);
            console.log("Sample:", skins[0]);
        } else if (typeof skins === 'object') {
            const keys = Object.keys(skins);
            console.log("Skins keys:", keys.length);
            console.log("Sample:", skins[keys[0]]);
        }

    } catch (e) {
        console.error("Error:", e.message);
    }
}

testByMykel();
