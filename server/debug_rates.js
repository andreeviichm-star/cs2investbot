
const axios = require('axios');

async function testParams() {
    try {
        console.log("Testing open.er-api.com...");
        const response = await axios.get('https://open.er-api.com/v6/latest/USD');
        console.log("Status:", response.status);
        console.log("Result:", response.data.result);
        console.log("RUB:", response.data.rates.RUB);
        console.log("KZT:", response.data.rates.KZT);
    } catch (error) {
        console.error("Error:", error.message);
        if (error.response) {
            console.error("Response data:", error.response.data);
        }
    }
}

testParams();
