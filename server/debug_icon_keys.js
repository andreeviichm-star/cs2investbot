const axios = require('axios');

async function debug() {
    console.log("Fetching skins...");
    const res = await axios.get('https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json');
    const items = res.data;

    console.log(`Total items: ${items.length}`);

    // Check random item
    const sample = items.find(i => i.name.includes('Redline'));
    console.log('Sample Item:', sample);

    // Check if base name exists
    const baseName = "AK-47 | Redline";
    const exact = items.find(i => i.name === baseName);
    console.log(`Exact match "${baseName}":`, !!exact);

    // Check if wear variants exist
    const wearVariant = items.find(i => i.name === "AK-47 | Redline (Field-Tested)");
    console.log(`Wear match "AK-47 | Redline (Field-Tested)":`, !!wearVariant);
}

debug();
