import React, { useEffect, useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Flame, BarChart3, PieChart, Book, ArrowLeft, Search } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useTranslation } from 'react-i18next';
import { searchItems } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchWikiCases, fetchWikiCollection } from '../services/wikiApi';
import ItemImage from './ItemImage';
import clsx from 'clsx';

const Overview = ({ portfolios = [], prices = {} }) => {
    const { t } = useTranslation();
    const { formatPrice, currency, convertPrice } = useSettings();
    const [view, setView] = useState('stats'); // 'stats' | 'wiki'
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [loading, setLoading] = useState(true);

    const [wikiCases, setWikiCases] = useState([]);
    const [wikiItemDetails, setWikiItemDetails] = useState({}); // Map of "Item Name" -> Item Data
    const fetchedCollections = React.useRef(new Set()); // Cache to avoid re-fetching same collection

    // Wiki Filters
    const [wikiSearch, setWikiSearch] = useState('');
    const [wikiFilter, setWikiFilter] = useState('all'); // 'all', 'Case', 'Collection'

    const filteredWikiCases = useMemo(() => {
        return wikiCases.filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(wikiSearch.toLowerCase());
            let matchesFilter = true;
            if (wikiFilter !== 'all') {
                if (wikiFilter === 'Case') {
                    matchesFilter = (c.type === 'Case') || c.name.includes('Case');
                } else if (wikiFilter === 'Collection') {
                    matchesFilter = (c.type === 'Collection') || c.name.includes('Collection');
                }
            }
            return matchesSearch && matchesFilter;
        });
    }, [wikiCases, wikiSearch, wikiFilter]);

    // Initial Wiki Load
    useEffect(() => {
        if (view === 'wiki' && wikiCases.length === 0) {
            setLoading(true);
            fetchWikiCases().then(data => {
                setWikiCases(data);
                setLoading(false);
            });
        }
    }, [view]);

    const handleSelectCollection = async (collection) => {
        // If we only have basic info (from list), fetch full details
        if (!collection.items) {
            setLoading(true);
            const fullData = await fetchWikiCollection(collection.id);
            if (fullData) {
                setSelectedCollection(fullData);
            }
            setLoading(false);
        } else {
            setSelectedCollection(collection);
        }
    };

    // Data Fetcher for Wiki Items Prices (when collection is open)
    useEffect(() => {
        let mounted = true;

        const fetchWikiItemsPrices = async () => {
            if (view === 'wiki' && selectedCollection && selectedCollection.items && !fetchedCollections.current.has(selectedCollection.id)) {

                // Don't set global loading here to avoid flicker, just fetch prices in bg
                fetchedCollections.current.add(selectedCollection.id);

                const itemsToFetch = selectedCollection.items;

                // Sequential fetch to be nice to the API
                for (const item of itemsToFetch) {
                    if (!mounted) break;

                    // Skip if we already have this specific item detail
                    if (wikiItemDetails[item.name]) continue;

                    try {
                        const res = await searchItems(item.name);
                        if (res.success && res.results.length > 0) {
                            const match = res.results.find(r => r.hash_name === item.name) || res.results[0];
                            setWikiItemDetails(prev => ({
                                ...prev,
                                [item.name]: match
                            }));
                        }
                    } catch (e) {
                        // ignore
                    }
                    await new Promise(r => setTimeout(r, 250));
                }
            }
        };

        if (view === 'wiki' && selectedCollection) {
            fetchWikiItemsPrices();
        }

        return () => {
            mounted = false;
        };
    }, [view, selectedCollection, wikiItemDetails]);



    // Calculate Total Balance & Invested across ALL portfolios
    const { totalBalance, totalInvested } = useMemo(() => {
        let total = 0;
        let invested = 0;
        portfolios.forEach(p => {
            p.items.forEach(item => {
                const currentPrice = prices[item.name]?.price || 0;
                total += currentPrice * item.quantity;
                invested += (item.buyPrice || 0) * item.quantity;
            });
        });
        return { totalBalance: total, totalInvested: invested };
    }, [portfolios, prices]);

    const totalProfit = totalBalance - totalInvested;
    const totalProfitPercent = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

    // Chart Time Range
    const [chartRange, setChartRange] = useState('1W'); // '1W', '1M', '1Y'

    // Generate Mock History Data based on current Total and selected Range
    const historyData = useMemo(() => {
        const data = [];
        let points = 7;
        let isMonthly = false;

        if (chartRange === '1M') points = 30;
        if (chartRange === '1Y') {
            points = 12;
            isMonthly = true;
        }

        let runningTotal = totalBalance > 0 ? totalBalance : 1000; // Fallback base if empty

        for (let i = points; i >= 0; i--) {
            const date = new Date();
            if (isMonthly) {
                date.setMonth(date.getMonth() - i);
            } else {
                date.setDate(date.getDate() - i);
            }

            // Random fluctuation (-5% to +5%)
            if (i > 0) {
                const change = (Math.random() * 0.1) - 0.05;
                runningTotal = runningTotal * (1 - change);
            } else {
                runningTotal = totalBalance; // Today is exact
            }

            // Determine if gain or loss relative to previous day (for color)
            const prevVal = i < points ? data[data.length - 1].value : runningTotal;
            const isGain = runningTotal >= prevVal;

            let label = '';
            if (chartRange === '1W') {
                label = date.toLocaleDateString('en-US', { weekday: 'short' });
            } else if (chartRange === '1M') {
                // Show date only for every 5th point to avoid clutter, or maybe just 'MMM d'
                // For 30 points, showing every label might be tight on mobile. Recharts handles this usually?
                // Let's shorten it.
                label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            } else {
                label = date.toLocaleDateString('en-US', { month: 'short' });
            }

            data.push({
                day: label,
                value: runningTotal,
                isGain
            });
        }
        return data;
    }, [totalBalance, chartRange]);



    // Stats Card Deck State
    const [activeStatIndex, setActiveStatIndex] = useState(0);

    const statsCards = [
        {
            title: t('total_balance'),
            value: formatPrice(totalBalance),
            sub: "All Portfolios Combined",
            bg: "bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 border-purple-500/10",
            text: "text-white",
            border: "border-white/10"
        },
        {
            title: "Total Invested",
            value: formatPrice(totalInvested),
            sub: "Cost Basis",
            bg: "bg-gradient-to-br from-gray-800/40 to-gray-900/40 border-white/5",
            text: "text-gray-200",
            border: "border-white/10"
        },
        {
            title: "Total Profit",
            value: (totalProfit >= 0 ? '+' : '') + formatPrice(totalProfit),
            sub: (totalProfitPercent >= 0 ? '+' : '') + totalProfitPercent.toFixed(2) + "%",
            bg: totalProfit >= 0
                ? "bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-teal-500/20"
                : "bg-gradient-to-br from-red-500/20 via-orange-500/20 to-rose-500/20",
            text: totalProfit >= 0 ? "text-emerald-300" : "text-red-300",
            subColor: totalProfitPercent >= 0 ? "text-emerald-400" : "text-red-400",
            border: totalProfit >= 0 ? "border-emerald-500/20" : "border-red-500/20",
            isProfit: true
        }
    ];

    const activeCard = statsCards[activeStatIndex];

    return (
        <div className="space-y-6">
            <div className="flex bg-white/5 p-1 rounded-xl">

                <button
                    onClick={() => setView('stats')}
                    className={clsx("flex-1 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2", view === 'stats' ? "bg-cs-purple text-white shadow-lg" : "text-gray-400 hover:text-white")}
                >
                    <BarChart3 size={16} /> {t('statistics')}
                </button>

                <button
                    onClick={() => { setView('wiki'); setSelectedCollection(null); }}
                    className={clsx("flex-1 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2", view === 'wiki' ? "bg-cs-gold/20 text-cs-gold shadow-lg border border-cs-gold/20" : "text-gray-400 hover:text-white")}
                >
                    <Book size={16} /> {t('wiki')}
                </button>
            </div>



            {
                view === 'stats' && (
                    // STATISTICS VIEW
                    <div className="space-y-6 animate-in slide-in-from-right duration-300">
                        {/* Interactive Stats Deck */}
                        <div className="flex flex-col items-center gap-4">
                            <div
                                onClick={() => setActiveStatIndex((prev) => (prev + 1) % statsCards.length)}
                                className={clsx(
                                    "w-full rounded-2xl p-8 border text-center relative overflow-hidden group cursor-pointer transition-all duration-300 transform active:scale-95 hover:shadow-lg hover:shadow-black/20",
                                    activeCard.bg,
                                    activeCard.border
                                )}
                            >
                                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2 select-none">{activeCard.title}</div>
                                <div className={clsx("text-4xl font-bold tracking-tight select-none transition-colors", activeCard.text)}>
                                    {activeCard.value}
                                </div>
                                <div className={clsx("text-sm font-medium mt-2 select-none", activeCard.isProfit ? activeCard.subColor : "text-gray-500")}>
                                    {activeCard.sub}
                                </div>
                                <div className="absolute bottom-3 right-3 opacity-20 text-[10px] uppercase font-bold tracking-widest text-white">Tap to switch</div>
                            </div>

                            {/* Indicators */}
                            <div className="flex gap-2">
                                {statsCards.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={clsx("w-2 h-2 rounded-full transition-colors duration-300",
                                            idx === activeStatIndex ? "bg-white" : "bg-white/20"
                                        )}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm text-gray-400 font-bold uppercase">{t('last_7_days')}</h3> {/* Maybe update translation key dynamically later */}
                                <div className="flex bg-black/20 rounded-lg p-0.5">
                                    {['1W', '1M', '1Y'].map(range => (
                                        <button
                                            key={range}
                                            onClick={() => setChartRange(range)}
                                            className={clsx("px-3 py-1 text-xs font-bold rounded-md transition-colors",
                                                chartRange === range ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-gray-300"
                                            )}
                                        >
                                            {range}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="h-64 w-full min-h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={historyData}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis
                                            dataKey="day"
                                            stroke="#6b7280"
                                            tick={{ fill: '#9ca3af', fontSize: 11 }}
                                            axisLine={false}
                                            tickLine={false}
                                            dy={10}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(20, 20, 30, 0.8)',
                                                borderColor: 'rgba(255, 255, 255, 0.1)',
                                                backdropFilter: 'blur(8px)',
                                                borderRadius: '12px',
                                                color: '#fff',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                            }}
                                            itemStyle={{ color: '#c4b5fd' }}
                                            cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }}
                                            formatter={(value) => [formatPrice(value), 'Balance']}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#8b5cf6"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorValue)"
                                            activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                view === 'wiki' && (
                    // WIKI VIEW
                    <div className="animate-in slide-in-from-right duration-300">
                        {!selectedCollection ? (
                            <div className="space-y-6">
                                {/* Wiki Controls */}
                                <div className="flex flex-col md:flex-row gap-4">
                                    {/* Search */}
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                        <input
                                            type="text"
                                            placeholder={t('search_wiki') || "Search cases & collections..."}
                                            value={wikiSearch}
                                            onChange={(e) => setWikiSearch(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-cs-blue focus:bg-black/40 text-white placeholder-gray-600"
                                        />
                                    </div>

                                    {/* Filter Tabs */}
                                    <div className="flex bg-white/5 p-1 rounded-lg shrink-0 overflow-x-auto">
                                        {['all', 'Case', 'Collection'].map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => setWikiFilter(type)}
                                                className={clsx("px-4 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
                                                    wikiFilter === type
                                                        ? "bg-white/10 text-white shadow-sm border border-white/10"
                                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                                )}
                                            >
                                                {type === 'all' ? t('all') || 'All' :
                                                    type === 'Case' ? t('cases') || 'Cases' :
                                                        t('collections') || 'Collections'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* List Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredWikiCases.length > 0 ? (
                                        filteredWikiCases.map(collection => (
                                            <div
                                                key={collection.id}
                                                onClick={() => handleSelectCollection(collection)}
                                                className="bg-white/5 rounded-xl p-4 border border-white/5 hover:bg-white/10 hover:border-cs-gold/30 transition-all cursor-pointer group flex flex-col items-center text-center relative overflow-hidden"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                                                <div className="w-32 h-32 flex items-center justify-center z-10 group-hover:scale-110 transition-transform duration-300 drop-shadow-2xl">
                                                    <ItemImage
                                                        src={collection.image}
                                                        alt={collection.name}
                                                        className="max-w-full max-h-full object-contain"
                                                    />
                                                </div>
                                                <div className="z-10 mt-4">
                                                    <h3 className="font-bold text-white group-hover:text-cs-gold transition-colors">{collection.name}</h3>
                                                    <div className="text-xs text-gray-400 mt-1">{collection.type || 'Collection'}</div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-full text-center py-10 text-gray-500">
                                            No results found.
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            // Detail View
                            <div className="space-y-6">
                                <button
                                    onClick={() => setSelectedCollection(null)}
                                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
                                >
                                    <ArrowLeft size={18} /> {t('back_to_wiki')}
                                </button>

                                <div className="flex flex-col md:flex-row gap-6 items-center md:items-start bg-white/5 rounded-2xl p-6 border border-white/10">
                                    <ItemImage
                                        src={selectedCollection.image}
                                        alt={selectedCollection.name}
                                        className="w-48 h-48 object-contain drop-shadow-2xl"
                                        rarity="Covert"
                                    />
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-2">{selectedCollection.name}</h2>
                                        <p className="text-gray-400 leading-relaxed">{selectedCollection.description}</p>
                                        <div className="mt-4 flex gap-2">
                                            <span className="px-3 py-1 bg-white/10 rounded-lg text-sm font-medium text-cs-gold border border-cs-gold/20">
                                                {selectedCollection.items.length} Items
                                            </span>
                                            <span className="px-3 py-1 bg-white/10 rounded-lg text-sm font-medium text-blue-400 border border-blue-500/20">
                                                {selectedCollection.type}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex justify-between items-center">
                                        {t('contains_items')}
                                        {loading && <span className="text-xs text-cs-gold animate-pulse">Fetching prices...</span>}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {selectedCollection.items.map((item, idx) => {
                                            // Try to find fetched details
                                            const fetched = wikiItemDetails[item.name];
                                            const iconUrl = item.image || (fetched?.asset_description?.icon_url ? `https://community.cloudflare.steamstatic.com/economy/image/${fetched.asset_description.icon_url}/360fx360f` : null);
                                            const price = fetched?.sell_price_text;

                                            return (
                                                <div key={idx} className="bg-white/5 rounded-lg p-3 flex items-center gap-4 border border-white/5 hover:bg-white/10 transition-colors group">
                                                    <div className={clsx("w-14 h-14 rounded-lg flex items-center justify-center overflow-hidden bg-black/20 shrink-0",
                                                        item.rarity === 'Covert' ? "border-l-4 border-red-500" :
                                                            item.rarity === 'Classified' ? "border-l-4 border-pink-500" :
                                                                item.rarity === 'Restricted' ? "border-l-4 border-purple-500" :
                                                                    "border-l-4 border-blue-500"
                                                    )}>
                                                        {iconUrl ? (
                                                            <ItemImage
                                                                src={iconUrl}
                                                                className="w-full h-full object-contain"
                                                                alt=""
                                                                rarity={item.rarity}
                                                            />
                                                        ) : (
                                                            <Flame size={20} className={clsx("opacity-50",
                                                                item.rarity === 'Covert' ? "text-red-500" :
                                                                    item.rarity === 'Classified' ? "text-pink-500" :
                                                                        item.rarity === 'Restricted' ? "text-purple-500" :
                                                                            "text-blue-500"
                                                            )} />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-bold text-sm text-white truncate group-hover:text-cs-gold transition-colors">{item.name}</div>
                                                        <div className="flex justify-between items-center mt-1">
                                                            <span className={clsx("text-[10px] uppercase tracking-wider font-bold",
                                                                item.rarity === 'Covert' ? "text-red-400" :
                                                                    item.rarity === 'Classified' ? "text-pink-400" :
                                                                        item.rarity === 'Restricted' ? "text-purple-400" :
                                                                            "text-blue-400"
                                                            )}>
                                                                {item.rarity}
                                                            </span>
                                                            {price && <span className="text-xs bg-black/30 px-2 py-0.5 rounded text-green-400 font-mono">{price}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )
            }
        </div >
    );
};

export default Overview;
