import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { addItemToPortfolio, getPrice, searchItems } from '../services/api';
import { useTranslation } from 'react-i18next';
import ItemImage from './ItemImage';
import { useSettings } from '../contexts/SettingsContext';

const AddItem = ({ userId, portfolios, activePortfolioId, onAdd }) => {
    const { t } = useTranslation();
    const { currency, formatPrice } = useSettings();

    const [targetPortfolioId, setTargetPortfolioId] = useState(activePortfolioId);
    const [name, setName] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    const [quantity, setQuantity] = useState(1);
    const [buyPrice, setBuyPrice] = useState('');
    const [iconUrl, setIconUrl] = useState(''); // New state for icon
    const [loading, setLoading] = useState(false);
    const [pricePreview, setPricePreview] = useState(null);

    const searchTimeoutRef = useRef(null);
    const wrapperRef = useRef(null);

    useEffect(() => {
        // Click outside to close dropdown
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowResults(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    // Clear price preview if currency changes
    useEffect(() => {
        setPricePreview(null);
        setBuyPrice('');
    }, [currency]);

    useEffect(() => {
        if (name.length > 2 && !showResults) {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = setTimeout(async () => {
                setIsSearching(true);
                const data = await searchItems(name);
                setSearchResults(data?.results || []);
                setShowResults(true);
                setIsSearching(false);
            }, 500);
        } else if (name.length <= 2) {
            setSearchResults([]);
            setShowResults(false);
            setIsSearching(false);
        }

        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        }
    }, [name]);

    const selectItem = async (item) => {
        setName(item.hash_name);
        // Store the icon hash
        if (item.asset_description && item.asset_description.icon_url) {
            setIconUrl(item.asset_description.icon_url);
        }
        setShowResults(false);
        setSearchResults([]);

        setLoading(true);
        // Fetch price in the SELECTED currency
        const data = await getPrice(item.hash_name, currency);
        setLoading(false);
        if (data?.success) {
            setPricePreview(data.price);
            setBuyPrice(data.price);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !quantity || !buyPrice) return;

        setLoading(true);
        try {
            // Send iconUrl to backend
            await addItemToPortfolio(userId, targetPortfolioId, { name, quantity, buyPrice, iconUrl, currency });
            onAdd();
            // Reset
            setName('');
            setQuantity(1);
            setBuyPrice('');
            setIconUrl('');
            setPricePreview(null);
        } catch (err) {
            console.error('Failed to add item', err);
            // alert('Failed to add item');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold">{t('add_investment')}</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Portfolio Selection */}
                {portfolios && portfolios.length > 0 && (
                    <div className="space-y-2">
                        <label className="text-sm text-gray-400">Target Portfolio</label>
                        <select
                            value={targetPortfolioId}
                            onChange={(e) => setTargetPortfolioId(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 focus:outline-none focus:border-cs-blue text-white"
                        >
                            {portfolios.map(p => (
                                <option key={p.id} value={p.id} className="bg-[#1b1b1b]">{p.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="space-y-2 relative" ref={wrapperRef}>
                    <label className="text-sm text-gray-400">{t('item_name')}</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setShowResults(false);
                            }}
                            placeholder={t('search_placeholder')}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 pr-10 focus:outline-none focus:border-cs-blue focus:ring-1 focus:ring-cs-blue transition-all"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                            {isSearching ? <Loader2 size={18} className="animate-spin text-cs-blue" /> : <Search size={18} />}
                        </div>
                    </div>

                    {/* Autocomplete Dropdown */}
                    {showResults && (
                        <div className="absolute z-10 w-full bg-[#1b1b1b] border border-white/10 rounded-lg shadow-xl max-h-60 overflow-y-auto mt-1">
                            {searchResults.length > 0 ? (
                                searchResults.map((result, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => selectItem(result)}
                                        className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 border-b border-white/5 last:border-0"
                                    >
                                        <ItemImage
                                            src={`https://community.cloudflare.steamstatic.com/economy/image/${result.asset_description.icon_url}/360fx360f`}
                                            alt=""
                                            className="w-8 h-8 object-contain"
                                        />
                                        <div className="truncate flex-1">
                                            <div className="text-sm font-medium text-white truncate">{result.hash_name}</div>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                    {t('no_results') || 'No results found'}
                                </div>
                            )}
                        </div>
                    )}

                    {pricePreview && (
                        <div className="text-xs text-green-400 bg-green-500/10 p-2 rounded border border-green-500/20">
                            {t('selected_price', { price: formatPrice(pricePreview) })}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm text-gray-400">{t('quantity')}</label>
                        <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 focus:outline-none focus:border-cs-blue"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm text-gray-400">{t('buy_price')} ({currency})</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={buyPrice}
                            onChange={(e) => setBuyPrice(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 focus:outline-none focus:border-cs-blue"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-cs-blue to-cs-purple text-white font-semibold py-3 rounded-lg mt-6 shadow-lg shadow-cs-blue/20 hover:shadow-cs-blue/30 transition-all active:scale-[0.98]"
                >
                    {loading ? t('adding') : t('add_to_portfolio')}
                </button>
            </form>
        </div>
    );
};

export default AddItem;
