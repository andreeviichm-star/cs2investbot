const axios = require('axios');
const { searchLocalItems, getIcon } = require('./wikiScraper'); // Import for icon lookup

let itemsCache = [];
let itemsMap = new Map(); // Name -> Item Data
let lastFetch = 0;
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

// Russian Mapping for search
const RU_MAPPING = {
    'кейс': 'case',
    'коллекция': 'collection',
    'капсула': 'capsule',
    'наклейка': 'sticker',
    'сувенир': 'souvenir',
    'набор': 'package',
    'перчатки': 'gloves',
    'нож': 'knife',
    'авп': 'awp',
    'калаш': 'ak-47',
    'эмка': 'm4a',
    'юсп': 'usp',
    'глок': 'glock',
    'дигл': 'desert eagle'
};

const init = async () => {
    if (Date.now() - lastFetch < CACHE_TTL && itemsCache.length > 0) {
        console.log('[Skinport] Cache is fresh.');
        return;
    }

    try {
        console.log('[Skinport] Fetching full item list...');
        const res = await axios.get('https://api.skinport.com/v1/items', {
            params: {
                app_id: 730,
                currency: 'USD',
                tradable: 0
            },
            headers: {
                'Accept-Encoding': 'br',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (res.data && Array.isArray(res.data)) {
            itemsCache = res.data;
            itemsMap.clear();

            itemsCache.forEach(item => {
                // Map Key is Market Hash Name
                itemsMap.set(item.market_hash_name, item);
            });

            lastFetch = Date.now();
            console.log(`[Skinport] Loaded ${itemsCache.length} items.`);
        }
    } catch (e) {
        console.error('[Skinport] Failed to fetch items:', e.message);
        if (e.response) {
            console.error('[Skinport] Status:', e.response.status);
            console.error('[Skinport] Data:', JSON.stringify(e.response.data).substring(0, 200));
        }
    }
};

const search = (query) => {
    if (!query || query.length < 2) return [];

    let lowerQuery = query.toLowerCase();

    // Apply RU Mapping
    for (const [ru, en] of Object.entries(RU_MAPPING)) {
        if (lowerQuery.includes(ru)) {
            lowerQuery = lowerQuery.replace(ru, en);
        }
    }

    // Filter Items
    // Limit to 20 results for performance
    const results = [];

    // Exact match priority? Or just simple include.
    // For large list, iterating might be slightly slow if not optimized, but 20k is fine for Node.

    for (const item of itemsCache) {
        if (item.market_hash_name.toLowerCase().includes(lowerQuery)) {
            results.push({
                hash_name: item.market_hash_name,
                asset_description: {
                    icon_url: getIcon(item.market_hash_name)
                },

                // Add price info while we're at it (bonus)
                price: item.min_price || item.suggested_price
            });
            if (results.length >= 50) break;
        }
    }
    return results;
};

const getPrice = (marketHashName) => {
    const item = itemsMap.get(marketHashName);
    if (!item) return null;
    return {
        price: item.min_price || item.suggested_price, // Prefer min listing, else suggested
        currency: 'USD',
        success: true
    };
};

const isLoaded = () => itemsCache.length > 0;
const getCount = () => itemsCache.length;

module.exports = { init, search, getPrice, isLoaded, getCount };
