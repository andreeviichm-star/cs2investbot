const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { scrapeCases, scrapeCollection, searchLocalItems } = require('./services/wikiScraper');
const skinport = require('./services/skinport');
const supabase = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-memory cache for Steam data
const priceCache = new Map(); // { marketHashName: { price, timestamp } }

// Steam Currency Codes
const CURRENCY_CODES = {
    'USD': 1,
    'RUB': 5,
    'KZT': 37
};

// Exchange Rates Cache
let exchangeRatesCache = {
    rates: { USD: 1, RUB: 100, KZT: 500 }, // Fallbacks
    timestamp: 0
};

const fetchExchangeRates = async () => {
    // Return cached if fresh (< 1 hour)
    if (Date.now() - exchangeRatesCache.timestamp < 3600000) {
        return exchangeRatesCache.rates;
    }

    try {
        console.log('Fetching fresh exchange rates...');
        const response = await axios.get('https://open.er-api.com/v6/latest/USD');
        if (response.data && response.data.result === 'success') {
            exchangeRatesCache = {
                rates: response.data.rates,
                timestamp: Date.now()
            };
            console.log('Rates updated:', exchangeRatesCache.rates.RUB, exchangeRatesCache.rates.KZT);
            return exchangeRatesCache.rates;
        }
    } catch (error) {
        console.error('Failed to fetch rates:', error.message);
    }
    return exchangeRatesCache.rates;
};

app.get('/api/rates', async (req, res) => {
    const rates = await fetchExchangeRates();
    res.json(rates);
});

const fetchSteamPrice = async (marketHashName, currencyCode = 'USD') => {
    try {
        const steamCurrencyId = CURRENCY_CODES[currencyCode] || 1;
        const cacheKey = `${marketHashName}_${currencyCode}`;

        if (priceCache.has(cacheKey)) {
            const { price, timestamp } = priceCache.get(cacheKey);
            if (Date.now() - timestamp < 60 * 60 * 1000) { // 1 hour cache
                return price;
            }
        }

        const url = `https://steamcommunity.com/market/priceoverview/`;
        console.log(`Fetching price for ${marketHashName} in ${currencyCode} (${steamCurrencyId})...`);

        const response = await axios.get(url, {
            params: {
                appid: 730,
                currency: steamCurrencyId,
                market_hash_name: marketHashName
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (response.data && response.data.success) {
            const priceStr = response.data.lowest_price || response.data.median_price;
            if (priceStr) {
                let rawPrice = priceStr;
                // Remove spaces
                rawPrice = rawPrice.replace(/\s/g, '');
                // Replace comma with dot
                rawPrice = rawPrice.replace(',', '.');
                // Keep only digits and dot
                rawPrice = rawPrice.replace(/[^0-9.]/g, '');

                const price = parseFloat(rawPrice);
                if (!isNaN(price)) {
                    priceCache.set(cacheKey, { price, timestamp: Date.now() });
                    return price;
                }
            }
        }
        return null;
    } catch (error) {
        if (error.response) {
            console.error(`Steam API Error for ${marketHashName}: ${error.response.status} - ${error.response.statusText}`);
            if (error.response.status === 429) {
                console.error("Rate limit exceeded. Waiting before retrying might help.");
            }
        } else {
            console.error(`Error fetching price for ${marketHashName}:`, error.message);
        }
        return null;
    }
};

app.get('/api/price', async (req, res) => {
    const { name, currency = 'USD' } = req.query;
    if (!name) return res.status(400).json({ error: 'Missing name parameter' });

    // 1. Try Skinport Cache first (Instant, No Rate Limit)
    const skinportPrice = skinport.getPrice(name);
    if (skinportPrice) {
        // Skinport returns USD. If client asked for other, index.js or frontend handles conversion?
        // Current architecture: `fetchSteamPrice` returns simple number. Frontend handles conversion if `currency` param passed?
        // Wait, `fetchSteamPrice` logic fetched in specific currency ID from Steam.
        // My `skinport.js` returns { price, currency: 'USD' }.
        // I need to convert it if requested currency is not USD.

        // Exchange Rate Logic
        // We have `exchangeRatesCache` and `fetchExchangeRates`.
        // Let's use them.
        let price = skinportPrice.price;
        if (currency !== 'USD') {
            const rates = await fetchExchangeRates(); // { USD: 1, RUB: 100... }
            if (rates[currency]) {
                price = price * rates[currency];
            }
        }

        return res.json({ success: true, price, currency });
    }

    // 2. Fallback to Steam (Slow, Rate Limited)
    const price = await fetchSteamPrice(name, currency);
    if (price !== null) {
        res.json({ success: true, price, currency });
    } else {
        res.status(500).json({ error: 'Failed to fetch price' });
    }
});

// Search Cache
const searchCache = new Map(); // { query: { results, timestamp } }

// API: Search Items (Proxy)
app.get('/api/search', async (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'Missing query parameter' });

    try {
        // 1. Try Skinport (Fast, Local Cache)
        const skinportResults = skinport.search(query);
        if (skinportResults.length > 0) {
            return res.json({ success: true, results: skinportResults });
        }

        // 2. Fallback to Local Wiki Search (if Skinport misses or down)
        console.log(`Skinport miss for "${query}", trying local wiki...`);
        const localResults = searchLocalItems(query);
        res.json({ success: true, results: localResults });

    } catch (error) {
        console.error('Search error:', error.message);
        res.json({ success: true, results: searchLocalItems(query) });
    }
});

// API: Wiki Data
app.get('/api/wiki/cases', async (req, res) => {
    const cases = await scrapeCases();
    res.json(cases);
});

app.get('/api/wiki/collection/:id', async (req, res) => {
    const { id } = req.params;
    const data = await scrapeCollection(id);
    if (data) {
        res.json(data);
    } else {
        res.status(404).json({ error: 'Collection not found' });
    }
});

// === MULTIPLE PORTFOLIOS API (SUPABASE) ===

// Get All Portfolios for User
app.get('/api/portfolio/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        // Fetch portfolios with items
        // Note: 'items:portfolio_items(*)' renames the joined table to 'items'
        const { data: portfolios, error } = await supabase
            .from('portfolios')
            .select('*, items:portfolio_items(*)')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        // If no portfolios, create default
        if (!portfolios || portfolios.length === 0) {
            const { data: newPortfolio, error: createError } = await supabase
                .from('portfolios')
                .insert({ user_id: userId, name: 'Main Portfolio' })
                .select()
                .single();

            if (createError) throw createError;

            return res.json([{ ...newPortfolio, items: [] }]);
        }

        // Map items to camelCase for all portfolios
        const mappedPortfolios = portfolios.map(p => ({
            ...p,
            items: (p.items || []).map(i => ({
                id: i.id,
                name: i.name,
                quantity: i.quantity,
                buyPrice: i.buy_price,
                currency: i.currency,
                iconUrl: i.icon_url,
                addedAt: i.added_at,
                portfolioId: i.portfolio_id
            }))
        }));

        res.json(mappedPortfolios);
    } catch (err) {
        console.error('Supabase Error (Get Portfolios):', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Create New Portfolio
app.post('/api/portfolio/:userId', async (req, res) => {
    const { userId } = req.params;
    const { name } = req.body;

    if (!name) return res.status(400).json({ error: 'Portfolio name required' });

    try {
        const { data, error } = await supabase
            .from('portfolios')
            .insert({ user_id: userId, name })
            .select()
            .single();

        if (error) throw error;

        // Return all portfolios to keep frontend state valid
        // Or just return the new one and let frontend append. 
        // Existing frontend expects { success: true, portfolio, portfolios: [] }
        // Let's refetch all for consistency
        const { data: allPortfolios } = await supabase
            .from('portfolios')
            .select('*, items:portfolio_items(*)')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        res.json({ success: true, portfolio: { ...data, items: [] }, portfolios: allPortfolios });
    } catch (err) {
        console.error('Supabase Error (Create Portfolio):', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Rename Portfolio
app.put('/api/portfolio/:userId/:portfolioId', async (req, res) => {
    const { portfolioId } = req.params; // userId checks handled by DB RLS or ignore
    const { name } = req.body;

    try {
        const { data, error } = await supabase
            .from('portfolios')
            .update({ name })
            .eq('id', portfolioId)
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, portfolio: data });
    } catch (err) {
        console.error('Supabase Error (Rename Portfolio):', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Delete Portfolio
app.delete('/api/portfolio/:userId/:portfolioId', async (req, res) => {
    const { portfolioId } = req.params;

    try {
        const { error } = await supabase
            .from('portfolios')
            .delete()
            .eq('id', portfolioId);

        if (error) throw error;

        res.json({ success: true });
    } catch (err) {
        console.error('Supabase Error (Delete Portfolio):', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Add Item to Specific Portfolio
app.post('/api/portfolio/:userId/:portfolioId/add', async (req, res) => {
    const { portfolioId } = req.params;
    const { name, quantity, buyPrice, iconUrl, currency } = req.body;

    try {
        const { data, error } = await supabase
            .from('portfolio_items')
            .insert({
                portfolio_id: portfolioId,
                name,
                quantity: parseInt(quantity) || 1,
                buy_price: parseFloat(buyPrice) || 0,
                currency: currency || 'USD',
                icon_url: iconUrl || null
            })
            .select()
            .single();

        if (error) throw error;

        // Map snake_case to camelCase for frontend compatibility if needed
        // OR update frontend to consume snake_case.
        // Easier to map here to preserve frontend contract.
        const mappedItem = {
            id: data.id,
            name: data.name,
            quantity: data.quantity,
            buyPrice: data.buy_price,
            currency: data.currency,
            iconUrl: data.icon_url,
            addedAt: data.added_at
        };

        // We need to return the updated portfolio structure or just the success
        // Frontend expects { success: true, portfolio: { ... } } (?)
        // Actually frontend expects "portfolio" with updated items array.
        // Let's fetch the full portfolio again to be safe.
        const { data: updatedPortfolio, error: fetchError } = await supabase
            .from('portfolios')
            .select('*, items:portfolio_items(*)')
            .eq('id', portfolioId)
            .single();

        if (fetchError) throw fetchError;

        // Map items to camelCase
        updatedPortfolio.items = updatedPortfolio.items.map(i => ({
            id: i.id,
            name: i.name,
            quantity: i.quantity,
            buyPrice: i.buy_price,
            currency: i.currency,
            iconUrl: i.icon_url,
            addedAt: i.added_at
        }));

        res.json({ success: true, portfolio: updatedPortfolio });
    } catch (err) {
        console.error('Supabase Error (Add Item):', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Delete Item from Portfolio
app.delete('/api/portfolio/:userId/:portfolioId/items/:itemId', async (req, res) => {
    const { portfolioId, itemId } = req.params;

    try {
        const { error } = await supabase
            .from('portfolio_items')
            .delete()
            .eq('id', itemId);

        if (error) throw error;

        // Fetch updated portfolio
        const { data: updatedPortfolio, error: fetchError } = await supabase
            .from('portfolios')
            .select('*, items:portfolio_items(*)')
            .eq('id', portfolioId)
            .single();

        if (fetchError) throw fetchError;

        // Map items to camelCase
        updatedPortfolio.items = updatedPortfolio.items.map(i => ({
            id: i.id,
            name: i.name,
            quantity: i.quantity,
            buyPrice: i.buy_price,
            currency: i.currency,
            iconUrl: i.icon_url,
            addedAt: i.added_at
        }));

        res.json({ success: true, portfolio: updatedPortfolio });
    } catch (err) {
        console.error('Supabase Error (Delete Item):', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Initial Rate Fetch & Auto-Refresh (Every Hour)
// Initial Rate Fetch & Auto-Refresh (Every Hour)
fetchExchangeRates(); // Fetch immediately on start
skinport.init(); // Fetch Skinport items
setInterval(fetchExchangeRates, 3600000); // Fetch every hour
setInterval(() => skinport.init(), 12 * 60 * 60 * 1000); // Refresh Skinport every 12h

// Status/Debug Endpoint
app.get('/api/status', (req, res) => {
    res.json({
        uptime: process.uptime(),
        skinport: {
            loaded: skinport.isLoaded ? skinport.isLoaded() : 'unknown',
            count: skinport.getCount ? skinport.getCount() : 'unknown'
        },
        searchCacheSize: searchCache ? searchCache.size : 0
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
