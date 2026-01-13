const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const fs = require('fs');

// Items we want to track
const trackedItems = new Set();
const precisePriceCache = new Map();

// Queue
let queue = [];
let currentIndex = 0;
let isRunning = false;
let RATE_LIMIT_DELAY = 5000; // Default 5s (Direct)

// Proxies
let proxies = [];
let proxyIndex = 0;

// Load Proxies from .env or file
const loadProxies = () => {
    // 1. Env Variable: STEAM_PROXIES="http://user:pass@ip:port,http://..."
    if (process.env.STEAM_PROXIES) {
        proxies = process.env.STEAM_PROXIES.split(',').map(p => p.trim()).filter(Boolean);
    }

    // 2. Or proxies.txt
    try {
        if (fs.existsSync('proxies.txt')) {
            const content = fs.readFileSync('proxies.txt', 'utf-8');
            const fileProxies = content.split('\n').map(p => p.trim()).filter(p => p && !p.startsWith('#'));
            proxies = [...proxies, ...fileProxies];
        }
    } catch (e) {
        console.error('Error loading proxies.txt:', e.message);
    }

    if (proxies.length > 0) {
        console.log(`[SteamScheduler] Loaded ${proxies.length} proxies. Switching to aggressive mode.`);
        RATE_LIMIT_DELAY = 2000; // Faster with proxies
    } else {
        console.log('[SteamScheduler] No proxies found. Using Direct Connection (Safe Mode).');
    }
};

const getNextAgent = () => {
    if (proxies.length === 0) return null; // Direct

    const proxyUrl = proxies[proxyIndex];
    proxyIndex = (proxyIndex + 1) % proxies.length;

    return new HttpsProxyAgent(proxyUrl);
};

// ... existing logic ...
const trackItem = (marketHashName) => {
    if (!marketHashName) return;
    if (!trackedItems.has(marketHashName)) {
        trackedItems.add(marketHashName);
        rebuildQueue();
    }
};

const rebuildQueue = () => {
    queue = Array.from(trackedItems);
};

const getPrice = (marketHashName) => {
    return precisePriceCache.get(marketHashName);
};

const start = () => {
    if (isRunning) return;
    isRunning = true;
    loadProxies();
    console.log('[SteamScheduler] Started precision pricing worker.');
    processNext();
};

const processNext = async () => {
    if (queue.length === 0) {
        setTimeout(processNext, 5000);
        return;
    }

    if (currentIndex >= queue.length) {
        currentIndex = 0;
    }

    const itemName = queue[currentIndex];
    await fetchSteamPrice(itemName);

    currentIndex++;
    setTimeout(processNext, RATE_LIMIT_DELAY);
};

const fetchSteamPrice = async (marketHashName) => {
    try {
        const url = `https://steamcommunity.com/market/priceoverview/`;
        const agent = getNextAgent();

        const res = await axios.get(url, {
            params: {
                appid: 730,
                currency: 1,
                market_hash_name: marketHashName
            },
            httpsAgent: agent, // Use Proxy
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 10000
        });

        if (res.data && res.data.success) {
            const rawPrice = res.data.lowest_price || res.data.median_price;
            if (rawPrice) {
                const priceNum = parseFloat(rawPrice.replace(/[^0-9.]/g, ''));
                if (!isNaN(priceNum)) {
                    precisePriceCache.set(marketHashName, {
                        price: priceNum,
                        currency: 'USD',
                        timestamp: Date.now()
                    });
                }
            }
        }
    } catch (e) {
        if (e.response && e.response.status === 429) {
            console.warn(`[SteamScheduler] 429 Rate Limit on ${proxies.length > 0 ? 'Proxy' : 'Direct'}. Skipping...`);
        } else {
            console.error(`[SteamScheduler] Error fetching ${marketHashName}: ${e.message}`);
        }
    }
};

module.exports = {
    trackItem,
    getPrice,
    start
};
