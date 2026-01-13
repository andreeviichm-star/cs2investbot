const axios = require('axios');

async function test() {
    // Wait for server to start
    await new Promise(r => setTimeout(r, 5000));

    try {
        console.log("Checking status...");
        const statusRes = await axios.get('http://localhost:3001/api/status');
        console.log("Status:", statusRes.data);

        console.log("Searching 'Fever Case'...");
        const res1 = await axios.get('http://localhost:3001/api/search?query=Fever Case');
        console.log("Fever Case Icon:", res1.data.results[0]?.asset_description?.icon_url);

        console.log("Searching 'Redline'...");
        const res2 = await axios.get('http://localhost:3001/api/search?query=Redline');
        const item = res2.data.results.find(i => i.hash_name.includes('AK-47'));
        console.log("AK-47 Redline Icon:", item?.asset_description?.icon_url);

    } catch (e) {
        console.error("Error:", e.message);
    }
}

test();
