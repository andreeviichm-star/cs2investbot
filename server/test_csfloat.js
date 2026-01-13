const axios = require('axios');

async function testCSFloat() {
    try {
        console.log("Searching CSFloat...");
        // Try to search generic query "AK-47" to see if it does fuzzy match
        // Or specific item "Fever Case"

        // CSFloat uses 'market_hash_name' filter? Or 'query'?
        // Trying generic query.
        const res = await axios.get('https://csfloat.com/api/v1/listings', {
            params: {
                limit: 10,
                sort_by: 'highest_price', // just to get some results
                // market_hash_name: 'Fever Case' // Trying direct match first
            },
            headers: {
                'Accept-Encoding': 'identity'
            }
        });

        // The API might not have a fuzzy search param documented well?
        // Let's check docs or guesses. usually 'query' or 'search'.

        console.log("Status:", res.status);
        if (res.data && Array.isArray(res.data)) {
            console.log("Count:", res.data.length);
            if (res.data.length > 0) {
                console.log("Sample:", res.data[0]);
                console.log("Image URL:", res.data[0].item?.icon_url || res.data[0].item?.image);
            }
        } else {
            console.log("Data structure:", typeof res.data); // Likely object { listings: [] }?
            if (res.data.listings) console.log("Listings:", res.data.listings.length);
        }

    } catch (e) {
        console.error("CSFloat Error:", e.message);
        if (e.response) console.error("Response:", e.response.status, e.response.data);
    }
}

testCSFloat();
