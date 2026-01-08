const https = require('https');

const fetchJson = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
};

const run = async () => {
    try {
        console.log('Fetching collections...');
        const collections = await fetchJson('https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/collections.json');
        console.log(`Fetched ${collections.length} collections.`);

        // Log names to help me match
        const names = collections.map(c => c.name);

        // Check for specific ones
        const targets = [
            "Anubis", "Train", "Ascent", "Boreal", "Radiant", "Mirage", "Dust",
            "Vertigo", "Havoc", "Control", "Canals", "Norse", "Gods", "Rising", "Chop"
        ];

        targets.forEach(t => {
            const matches = names.filter(n => n.toLowerCase().includes(t.toLowerCase()));
            console.log(`Matches for ${t}:`, matches);
        });

    } catch (error) {
        console.error('Error:', error);
    }
};

run();
