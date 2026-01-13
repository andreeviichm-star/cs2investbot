const axios = require('axios');

async function debug() {
    try {
        console.log("Fetching items from Skinport...");
        const res = await axios.get('https://api.skinport.com/v1/items', {
            params: {
                app_id: 730,
                currency: 'USD',
                tradable: 0
            }
        });

        const items = res.data;
        const check = [
            'Revolution Case',
            'AK-47 | Redline (Field-Tested)',
            'AWP | Asiimov (Field-Tested)',
            'Dreams & Nightmares Case'
        ];

        console.log("\n--- Price Check ---");
        check.forEach(name => {
            const item = items.find(i => i.market_hash_name === name);
            if (item) {
                console.log(`\n[${name}]`);
                console.log(`  Min Price (Cash): $${item.min_price}`);
                console.log(`  Suggested Price (Steam): $${item.suggested_price}`);
                console.log(`  Max Price: $${item.max_price}`);
                console.log(`  Mean Price: $${item.mean_price}`);
                console.log(`  Quantity: ${item.quantity}`);
            } else {
                console.log(`\n[${name}] NOT FOUND`);
            }
        });

    } catch (e) {
        console.error(e.message);
    }
}

debug();
