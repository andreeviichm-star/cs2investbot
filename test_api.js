const axios = require('axios');

async function testSkinport() {
    try {
        console.log("Testing Skinport API...");
        // Requesting non-tradable items first as they are cheaper/more common reference?
        // Actually just 'items' endpoint returns the catalog.
        const res = await axios.get('https://api.skinport.com/v1/items', {
            params: {
                app_id: 730,
                currency: 'USD',
                tradable: 0
            },
            headers: {
                'Accept-Encoding': 'identity', // Prevent compression issues in raw node if any
                'Accept': 'application/json'
            }
        });
        console.log("Status:", res.status);
        console.log("Items count:", res.data.length);
        console.log("Sample:", res.data[0]);
    } catch (e) {
        console.error("Skinport Error:", e.message);
        if (e.response) console.error("Response:", e.response.status, e.response.data);
    }
}

testSkinport();
