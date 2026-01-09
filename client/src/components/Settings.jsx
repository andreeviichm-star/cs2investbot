import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../contexts/SettingsContext';
import { ArrowLeft, Save, Wallet, Pencil, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { createPortfolio, renamePortfolio, deletePortfolio } from '../services/api';

const Settings = ({ userId, portfolios, onCreate, onDelete, onRename }) => {
    const { t } = useTranslation();
    const {
        language, setLanguage,
        currency, setCurrency,
        exchangeRates, updateExchangeRate,
        lossThreshold, setLossThreshold,
        gainThreshold, setGainThreshold,
        notificationsEnabled, setNotificationsEnabled
    } = useSettings();
    const [newPortfolioName, setNewPortfolioName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');

    const startEditing = (portfolio) => {
        setEditingId(portfolio.id);
        setEditName(portfolio.name);
    };

    const saveRename = async (id) => {
        if (!editName.trim()) return;
        await renamePortfolio(userId, id, editName);
        setEditingId(null);
        if (onRename) onRename(id, editName);
    };

    const handleDeletePortfolio = async (id) => {
        if (confirm(t('confirm_delete_portfolio'))) {
            await deletePortfolio(userId, id);
            if (onDelete) onDelete(id);
        }
    };

    const handleCreatePortfolio = async (e) => {
        e.preventDefault();
        if (!newPortfolioName) return;

        const res = await createPortfolio(userId, newPortfolioName);
        setNewPortfolioName('');
        if (res && res.success && onCreate) {
            onCreate(res.portfolio);
        }
        alert('Portfolio Created');
    };

    return (
        <div className="space-y-6 pb-20">
            <h2 className="text-xl font-bold">{t('settings_title')}</h2>

            {/* Manage Portfolios */}
            <div className="space-y-4 border-b border-white/5 pb-6">
                <h3 className="text-lg font-medium flex items-center gap-2">
                    <Wallet size={18} className="text-cs-blue" />
                    {t('manage_portfolios')}
                </h3>

                <div className="space-y-2">
                    {portfolios && portfolios.map(p => (
                        <div key={p.id} className="bg-white/5 p-3 rounded-lg flex justify-between items-center text-sm group">
                            {editingId === p.id ? (
                                <div className="flex gap-2 flex-1 mr-2">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="bg-black/20 border border-white/10 rounded px-2 py-1 text-sm w-full focus:outline-none focus:border-cs-blue"
                                        autoFocus
                                    />
                                    <button onClick={() => saveRename(p.id)} className="text-green-400 hover:text-green-300">
                                        <Save size={16} />
                                    </button>
                                </div>
                            ) : (
                                <span>{p.name}</span>
                            )}

                            <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-gray-500 text-xs mr-2">{p.items.length} items</span>
                                <button
                                    onClick={() => startEditing(p)}
                                    className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded"
                                    title="Rename"
                                >
                                    <Pencil size={14} />
                                </button>
                                <button
                                    onClick={() => handleDeletePortfolio(p.id)}
                                    className={`p-1 rounded ${portfolios.length <= 1 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-red-400 hover:bg-red-400/10'}`}
                                    title={portfolios.length <= 1 ? t('cannot_delete_last') : t('delete')}
                                    disabled={portfolios.length <= 1}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <form onSubmit={handleCreatePortfolio} className="flex gap-2 mt-4">
                    <input
                        type="text"
                        value={newPortfolioName}
                        onChange={(e) => setNewPortfolioName(e.target.value)}
                        placeholder={t('new_portfolio_placeholder')}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:border-cs-blue"
                    />
                    <button type="submit" className="bg-cs-blue px-4 py-2 rounded-lg text-sm font-bold">{t('create')}</button>
                </form>
            </div>

            {/* Language Section */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                <h3 className="text-sm text-gray-400 font-medium uppercase tracking-wider">{t('language')}</h3>
                <div className="flex gap-2">
                    {['en', 'ru'].map((lang) => (
                        <button
                            key={lang}
                            onClick={() => setLanguage(lang)}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors border ${language === lang
                                ? 'bg-cs-blue/20 border-cs-blue text-cs-blue'
                                : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
                                }`}
                        >
                            {lang === 'en' ? '🇺🇸 ' + t('english') : '🇷🇺 ' + t('russian')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Currency Section */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                <h3 className="text-sm text-gray-400 font-medium uppercase tracking-wider">{t('currency')}</h3>
                <div className="flex gap-2">
                    {['USD', 'RUB', 'KZT'].map((curr) => (
                        <button
                            key={curr}
                            onClick={() => setCurrency(curr)}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors border ${currency === curr
                                ? 'bg-cs-gold/20 border-cs-gold text-cs-gold'
                                : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
                                }`}
                        >
                            {curr}
                        </button>
                    ))}
                </div>
            </div>

            {/* Gain/Loss Thresholds Section */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-6">

                {/* Master Toggle */}
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                        {t('enable_notifications') || "Enable Notifications"}
                    </h3>
                    <button
                        onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${notificationsEnabled ? 'bg-cs-blue' : 'bg-white/10'}`}
                    >
                        <div
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${notificationsEnabled ? 'translate-x-6' : 'translate-x-0'}`}
                        />
                    </button>
                </div>

                {/* Loss Threshold */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm text-red-400 font-bold uppercase tracking-wider flex items-center gap-2">
                            <TrendingDown size={16} /> {t('alert_loss_threshold')}
                        </h3>
                        <div className="bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-lg font-mono text-red-400 font-bold min-w-[3.5rem] text-center shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                            {lossThreshold}%
                        </div>
                    </div>
                    <div className="relative h-6 flex items-center">
                        {/* Custom Track Background */}
                        <div className="absolute w-full h-2 bg-gray-800 rounded-full overflow-hidden shadow-inner">
                            <div
                                className="h-full bg-gradient-to-r from-red-900 via-red-600 to-red-500 transition-all duration-150"
                                style={{ width: `${(lossThreshold / 90) * 100}%` }}
                            />
                        </div>
                        <input
                            type="range"
                            min="5"
                            max="90"
                            step="5"
                            value={lossThreshold}
                            onChange={(e) => setLossThreshold(Number(e.target.value))}
                            className="absolute w-full h-2 opacity-0 cursor-pointer z-10"
                        />
                        {/* Custom Thumb (Pseudo-element visual hack using left positioning) */}
                        <div
                            className="absolute h-5 w-5 bg-white rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)] border-2 border-red-500 pointer-events-none transition-all duration-150 z-20"
                            style={{ left: `calc(${(lossThreshold / 90) * 100}% - 10px)` }}
                        />
                    </div>
                </div>

                <div className="border-t border-white/5"></div>

                {/* Gain Threshold */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm text-green-400 font-bold uppercase tracking-wider flex items-center gap-2">
                            <TrendingUp size={16} /> {t('alert_gain_threshold')}
                        </h3>
                        <div className="bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-lg font-mono text-green-400 font-bold min-w-[3.5rem] text-center shadow-[0_0_10px_rgba(74,222,128,0.2)]">
                            {gainThreshold}%
                        </div>
                    </div>
                    <div className="relative h-6 flex items-center">
                        {/* Custom Track Background */}
                        <div className="absolute w-full h-2 bg-gray-800 rounded-full overflow-hidden shadow-inner">
                            <div
                                className="h-full bg-gradient-to-r from-green-900 via-green-600 to-green-500 transition-all duration-150"
                                style={{ width: `${(gainThreshold / 200) * 100}%` }}
                            />
                        </div>
                        <input
                            type="range"
                            min="5"
                            max="200"
                            step="5"
                            value={gainThreshold}
                            onChange={(e) => setGainThreshold(Number(e.target.value))}
                            className="absolute w-full h-2 opacity-0 cursor-pointer z-10"
                        />
                        {/* Custom Thumb */}
                        <div
                            className="absolute h-5 w-5 bg-white rounded-full shadow-[0_0_10px_rgba(74,222,128,0.5)] border-2 border-green-500 pointer-events-none transition-all duration-150 z-20"
                            style={{ left: `calc(${(gainThreshold / 200) * 100}% - 10px)` }}
                        />
                    </div>
                </div>

                <p className="text-xs text-gray-500">{t('alert_threshold_desc')}</p>
            </div>
        </div>
    );
};

export default Settings;
