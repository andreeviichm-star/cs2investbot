const axios = require('axios');

async function debug() {
    try {
        console.log("Fetching items from CSGOBackpack...");
        // This is a large file (~15MB), might be slow.
        // But let's try the consolidated endpoint or individual.
        // Individual: http://csgobackpack.net/api/GetItemPrice/?currency=USD&id=Revolution%20Case

        const caseName = "Revolution Case";
        const akName = "AK-47 | Redline (Field-Tested)";

        const config = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        };

        const url1 = `http://csgobackpack.net/api/GetItemPrice/?currency=USD&id=${encodeURIComponent(caseName)}&time=7&icon=1`;
        console.log(`Fetching ${caseName}...`);
        const res1 = await axios.get(url1, config);
        console.log(res1.data);

        const url2 = `http://csgobackpack.net/api/GetItemPrice/?currency=USD&id=${encodeURIComponent(akName)}&time=7&icon=1`;
        console.log(`Fetching ${akName}...`);
        const res2 = await axios.get(url2, config);
        console.log(res2.data);

    } catch (e) {
        console.error(e.message);
    }
}

debug();
