const axios = require('axios');

async function debug() {
    try {
        console.log("Fetching skins...");
        const res = await axios.get('https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json');
        const items = res.data;

        const karambits = items.filter(i => i.name.includes('Karambit'));
        console.log(`Found ${karambits.length} Karambits.`);
        console.log('Sample names:');
        karambits.slice(0, 10).forEach(k => console.log(`"${k.name}"`));

    } catch (e) {
        console.error(e.message);
    }
}

debug();
