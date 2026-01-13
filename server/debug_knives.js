const axios = require('axios');

async function debug() {
    try {
        console.log("Fetching skins...");
        const res = await axios.get('https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json');
        const items = res.data;

        console.log(`Total items: ${items.length}`);

        const karaFade = items.find(i => i.name === 'Karambit | Fade');
        console.log('Karambit | Fade found:', !!karaFade);

        const karaVanilla = items.find(i => i.name === 'Karambit'); // Vanilla usually has name "Karambit" or "★ Karambit"
        console.log('Karambit (Vanilla) found:', !!karaVanilla);

        const starKara = items.find(i => i.name === '★ Karambit');
        console.log('★ Karambit found:', !!starKara);

    } catch (e) {
        console.error(e.message);
    }
}

debug();
