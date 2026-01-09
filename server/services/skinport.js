const axios = require('axios');
const { searchLocalItems, getIcon } = require('./wikiScraper'); // Import for icon lookup

let itemsCache = [];
let itemsMap = new Map(); // Name -> Item Data
let lastFetch = 0;
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

// Russian Mapping for search
const RU_MAPPING = require('../data/ru_mapping');

const init = async (force = false) => {
    // If not forced and cache is fresh (30 min), skip
    // Reduced TTL to 30 min for better accuracy
    const CACHE_TTL = 30 * 60 * 1000;

    if (!force && Date.now() - lastFetch < CACHE_TTL && itemsCache.length > 0) {
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

    // Apply RU Mapping (naive word replacement)
    // We sort keys by length desc to avoid partial replacements (e.g. replacing part of a word)
    // But for now, simple iter is fine for single keywords.
    // Better strategy: Replace known phrases first.

    // Check if query contains Russian chars
    if (/[а-яА-ЯёЁ]/.test(lowerQuery)) {
        for (const [ru, en] of Object.entries(RU_MAPPING)) {
            if (lowerQuery.includes(ru)) {
                lowerQuery = lowerQuery.replace(new RegExp(ru, 'g'), en);
            }
        }
    }

    // ... search logic

    // Filter Items
    // Limit to 20 results for performance
    const results = [];

    // Exact match priority? Or just simple include.
    // For large list, iterating might be slightly slow if not optimized, but 20k is fine for Node.

    for (const item of itemsCache) {
        if (item.market_hash_name.toLowerCase().includes(lowerQuery)) {
            const steamPrice = item.suggested_price || item.min_price;
            results.push({
                hash_name: item.market_hash_name,
                asset_description: {
                    icon_url: getIcon(item.market_hash_name)
                },
                price: steamPrice ? Number(steamPrice.toFixed(2)) : 0,
                cash_price: item.min_price ? Number(item.min_price.toFixed(2)) : 0
            });
            if (results.length >= 50) break;
        }
    }
    return results;
};

const getPrice = (marketHashName) => {
    const item = itemsMap.get(marketHashName);
    if (!item) return null;
    const steamPrice = item.suggested_price || item.min_price;
    return {
        price: steamPrice ? Number(steamPrice.toFixed(2)) : 0, // Prefer Steam Price
        cash_price: item.min_price ? Number(item.min_price.toFixed(2)) : 0,
        currency: 'USD',
        success: true
    };
};

const isLoaded = () => itemsCache.length > 0;
const getCount = () => itemsCache.length;

const startAutoRefresh = () => {
    // Initial fetch
    init();
    // Refresh every 30 minutes
    setInterval(() => {
        console.log('[Skinport] Auto-refreshing prices...');
        init(true);
    }, 30 * 60 * 1000);
};

module.exports = { init, search, getPrice, isLoaded, getCount, startAutoRefresh };
