import { useState, useMemo } from 'react';
import { MoreHorizontal, Trash2, Search, ArrowUpDown, Filter, X, Clock } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useTranslation } from 'react-i18next';
import ItemImage from './ItemImage';
import clsx from 'clsx';
import { deleteItem, moveItem } from '../services/api';
import { ArrowRight, Check } from 'lucide-react'; // Icons for move UI

const PortfolioList = ({ userId, portfolio = { items: [] }, prices = {}, activePortfolioId, onUpdate, onAddClick, onMove, portfolios = [] }) => {
    const { t } = useTranslation();
    const { formatPrice, currency } = useSettings();

    // Filter/Sort State
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOption, setSortOption] = useState('date_desc');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // State for expanded items
    const [expandedItems, setExpandedItems] = useState(new Set());

    const toggleExpand = (id) => {
        setExpandedItems(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const [movingItem, setMovingItem] = useState(null); // { id: itemId, targetId: portfolioId }

    const handleDelete = async (itemId) => {
        const targetPortfolioId = portfolio.id || activePortfolioId;
        if (targetPortfolioId) {
            await deleteItem(userId, targetPortfolioId, itemId);
            if (onUpdate) onUpdate(); // Fallback if no specific handler, though delete uses optimistic usually? App doesn't have optimistic delete for items yet? 
            // Wait, App.jsx handles portfolio delete, but item delete is still onUpdate refetch in this file?
            // User requested MOVE feature. Let's focus on Move.
        }
    };

    const handleMoveInit = (itemId) => {
        // Init with first available portfolio that is NOT current
        const currentId = portfolio.id || activePortfolioId;
        const target = portfolios.find(p => p.id !== currentId);
        if (target) {
            setMovingItem({ id: itemId, targetId: target.id });
        } else {
            alert(t('no_other_portfolios') || "Create another portfolio first!");
        }
    };

    const handleMoveConfirm = async () => {
        if (!movingItem) return;
        const currentId = portfolio.id || activePortfolioId;

        const success = await moveItem(userId, currentId, movingItem.id, movingItem.targetId);
        if (success) {
            if (onMove) onMove(movingItem.id, currentId, movingItem.targetId);
            setMovingItem(null);
            // Close expand?
            toggleExpand(movingItem.id);
        }
    };

    const filteredItems = useMemo(() => {
        let items = [...portfolio.items].map(item => {
            const currentPrice = prices[item.name]?.price || 0;
            const profit = (currentPrice - item.buyPrice) * item.quantity;
            const profitPercent = item.buyPrice > 0
                ? ((currentPrice - item.buyPrice) / item.buyPrice) * 100
                : 0;
            return { ...item, currentPrice, profit, profitPercent };
        });

        // 1. Filter by Name
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            items = items.filter(i => i.name.toLowerCase().includes(q));
        }

        // 2. Filter by Price Range
        if (minPrice !== '') {
            items = items.filter(i => i.currentPrice >= parseFloat(minPrice));
        }
        if (maxPrice !== '') {
            items = items.filter(i => i.currentPrice <= parseFloat(maxPrice));
        }

        // 3. Sort
        items.sort((a, b) => {
            switch (sortOption) {
                case 'price_desc': return b.currentPrice - a.currentPrice;
                case 'price_asc': return a.currentPrice - b.currentPrice;
                case 'profit_desc': return b.profitPercent - a.profitPercent;
                case 'profit_asc': return a.profitPercent - b.profitPercent;
                case 'date_desc':
                default:
                    return new Date(b.addedAt || 0) - new Date(a.addedAt || 0);
            }
        });

        return items;
    }, [portfolio.items, prices, searchQuery, sortOption, minPrice, maxPrice]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{t('portfolio')}</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={clsx("w-10 h-10 rounded-lg flex items-center justify-center transition-colors border border-white/10",
                            showFilters ? "bg-cs-blue text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
                        )}
                    >
                        <Filter size={18} />
                    </button>
                    <button
                        onClick={onAddClick}
                        className="w-10 h-10 bg-cs-blue text-white rounded-lg flex items-center justify-center hover:bg-cs-blue/80 transition-colors shadow-lg shadow-cs-blue/20"
                    >
                        <span className="text-2xl leading-none block pb-1">+</span>
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className={clsx("grid gap-4 bg-white/5 rounded-xl p-4 border border-white/10 transition-all duration-300 overflow-hidden",
                showFilters ? "max-h-[300px] opacity-100 mb-4" : "max-h-0 opacity-0 p-0 border-0 mb-0"
            )}>
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input
                            type="text"
                            placeholder={t('search_placeholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-cs-blue focus:bg-black/40 text-white placeholder-gray-600"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Sort */}
                    <div className="relative min-w-[180px]">
                        <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-cs-blue bg-none appearance-none cursor-pointer text-white"
                        >
                            <option value="date_desc">Newest First</option>
                            <option value="price_desc">Price: High to Low</option>
                            <option value="price_asc">Price: Low to High</option>
                            <option value="profit_desc">Profit: Highest Growth</option>
                            <option value="profit_asc">Profit: Biggest Drop</option>
                        </select>
                    </div>
                </div>

                {/* Price Range */}
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block">Min Price ({currency})</label>
                        <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cs-blue text-white"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block">Max Price ({currency})</label>
                        <input
                            type="number"
                            min="0"
                            placeholder="Any"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cs-blue text-white"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-3 mb-20">
                {filteredItems.length > 0 ? (
                    filteredItems.map((item) => {
                        const daysHeld = item.addedAt ? Math.floor((new Date() - new Date(item.addedAt)) / (1000 * 60 * 60 * 24)) : 0;
                        const isExpanded = expandedItems.has(item.id);

                        return (
                            <div
                                key={item.id}
                                onClick={() => toggleExpand(item.id)}
                                className={clsx(
                                    "bg-white/5 rounded-xl border border-white/5 group relative transition-all cursor-pointer overflow-hidden",
                                    isExpanded ? "ring-1 ring-cs-blue/50 bg-white/10" : "hover:bg-white/10"
                                )}
                            >
                                {/* MAIN SUMMARY (Always Visible) */}
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4 overflow-hidden">
                                        <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center shrink-0 overflow-hidden relative">
                                            {item.iconUrl ? (
                                                <ItemImage
                                                    src={item.iconUrl?.startsWith('http')
                                                        ? item.iconUrl
                                                        : `https://community.cloudflare.steamstatic.com/economy/image/${item.iconUrl}/360fx360f`}
                                                    alt={item.name}
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <span className="text-xs font-bold text-gray-500">CS2</span>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-medium text-white truncate text-sm md:text-base">{item.name}</div>
                                            <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                                                <span>{formatPrice(item.currentPrice)}</span>
                                                <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                                                <span className={clsx("font-medium", item.profit >= 0 ? "text-green-400" : "text-red-400")}>
                                                    {item.profit >= 0 ? '+' : ''}{item.profitPercent.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Side Summary */}
                                    <div className="flex items-center gap-4">
                                        <div className="text-right shrink-0">
                                            <div className={clsx("font-bold text-sm", item.profit >= 0 ? "text-green-400" : "text-red-400")}>
                                                {item.profit >= 0 ? '+' : ''}{formatPrice(item.profit)}
                                            </div>
                                        </div>
                                        <div className={clsx("transform transition-transform duration-300 text-gray-500", isExpanded ? "rotate-180 text-white" : "")}>
                                            <MoreHorizontal size={20} />
                                        </div>
                                    </div>
                                </div>

                                {/* EXPANDED DETAILS */}
                                <div className={clsx(
                                    "grid grid-cols-2 md:grid-cols-4 gap-3 px-4 pb-4 pt-1 transition-all duration-300",
                                    isExpanded ? "opacity-100 max-h-[200px]" : "opacity-0 max-h-0 hidden"
                                )}>
                                    {/* Separator */}
                                    <div className="col-span-full h-px bg-white/5 mb-1"></div>

                                    {/* Detail 1: Buy Price */}
                                    <div className="bg-black/20 rounded-lg p-2 flex flex-col justify-center">
                                        <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-0.5">{t('buy_price')}</div>
                                        <div className="text-xs font-mono text-gray-300">{formatPrice(item.buyPrice, item.currency)}</div>
                                    </div>

                                    {/* Detail 2: Quantity */}
                                    <div className="bg-black/20 rounded-lg p-2 flex flex-col justify-center">
                                        <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-0.5">{t('quantity')}</div>
                                        <div className="text-xs font-mono text-white">x{item.quantity}</div>
                                    </div>

                                    {/* Detail 3: Hold Time */}
                                    <div className="bg-black/20 rounded-lg p-2 flex flex-col justify-center">
                                        <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-0.5">{t('time_held')}</div>
                                        <div className="text-xs font-mono text-blue-300 flex items-center gap-1.5">
                                            <Clock size={10} /> {daysHeld} {t('days')}
                                        </div>
                                    </div>

                                    {/* Detail 4: Action */}
                                    {/* Detail 4: Actions */}
                                    <div className="flex flex-col gap-2 justify-end">
                                        {/* Move UI */}
                                        {movingItem && movingItem.id === item.id ? (
                                            <div className="flex flex-col gap-1 w-full bg-white/5 p-1 rounded-lg animate-in fade-in slide-in-from-right-2">
                                                <select
                                                    value={movingItem.targetId}
                                                    onChange={(e) => setMovingItem({ ...movingItem, targetId: e.target.value })}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white mb-1 focus:outline-none focus:border-cs-blue"
                                                >
                                                    {portfolios.filter(p => p.id !== (portfolio.id || activePortfolioId)).map(p => (
                                                        <option key={p.id} value={p.id}>{p.name}</option>
                                                    ))}
                                                </select>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleMoveConfirm(); }}
                                                        className="flex-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 py-1 rounded text-xs font-bold"
                                                    >
                                                        <Check size={12} className="mx-auto" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setMovingItem(null); }}
                                                        className="flex-1 bg-white/10 text-gray-400 hover:bg-white/20 py-1 rounded text-xs font-bold"
                                                    >
                                                        <X size={12} className="mx-auto" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleMoveInit(item.id); }}
                                                className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 w-full uppercase tracking-wide"
                                                disabled={portfolios.length <= 1}
                                            >
                                                <ArrowRight size={14} /> {t('move') || 'Move'}
                                            </button>
                                        )}

                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 w-full uppercase tracking-wide"
                                        >
                                            <Trash2 size={14} /> {t('delete')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-10">
                        <div className="text-gray-500 mb-2">
                            {portfolio.items.length > 0 ? t('no_results') || 'No items match filters' : t('portfolio_empty')}
                        </div>
                        {portfolio.items.length === 0 && (
                            <div className="text-sm text-cs-blue">{t('start_adding')}</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PortfolioList;
