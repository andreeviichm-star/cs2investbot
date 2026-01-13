const axios = require('axios');

async function testSkinport() {
    try {
        console.log("Testing Skinport API with Brotli...");
        const res = await axios.get('https://api.skinport.com/v1/items', {
            params: {
                app_id: 730,
                currency: 'USD',
                tradable: 0
            },
            headers: {
                'Accept-Encoding': 'br' // explicit request
            }
        });
        console.log("Status:", res.status);
        console.log("Items count:", res.data.length);
        if (res.data.length > 0) {
            console.log("Sample Keys:", Object.keys(res.data[0]));
            console.log("Sample:", res.data[0]);
        }
    } catch (e) {
        console.error("Skinport Error:", e.message);
        if (e.response) {
            console.error("Response:", e.response.status, e.response.data); // data might be buffer if not decoded
        }
    }
}

testSkinport();
