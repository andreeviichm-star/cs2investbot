import React, { useMemo, useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
// import { Plus } from 'lucide-react'; 
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../contexts/SettingsContext';
import SmartAlert from './SmartAlert';

const Dashboard = ({ portfolio, prices, portfolios, activePortfolioId, onSelectPortfolio, onAddClick }) => {
    const { t } = useTranslation();
    const { formatPrice, currency, convertPrice, lossThreshold, gainThreshold } = useSettings();

    // Alert State
    const [alertItem, setAlertItem] = useState(null);
    const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

    // Ensure portfolio is not null/undefined for calculations
    const currentPortfolio = portfolio || { items: [] };

    const stats = useMemo(() => {
        let totalValue = 0;
        let totalInvested = 0;
        const itemsWithProfit = [];

        currentPortfolio.items.forEach(item => {
            const currentPrice = prices[item.name]?.price || 0;
            const value = currentPrice * item.quantity;

            // Convert buyPrice to valid invested amount in SELECTED currency
            const itemCurrency = item.currency || 'USD'; // Default to USD if missing
            const convertedBuyPrice = convertPrice(item.buyPrice, itemCurrency, currency);
            const invested = convertedBuyPrice * item.quantity;

            totalValue += value;
            totalInvested += invested;

            if (invested > 0) {
                const profit = value - invested;
                const profitPercent = (profit / invested) * 100;
                itemsWithProfit.push({ ...item, profit, profitPercent, currentPrice });
            }
        });

        const totalProfit = totalValue - totalInvested;
        const totalProfitPercent = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

        // Sort by absolute profit impact (top movers)
        itemsWithProfit.sort((a, b) => Math.abs(b.profit) - Math.abs(a.profit));

        return {
            totalValue,
            totalInvested,
            totalProfit,
            totalProfitPercent,
            topMovers: itemsWithProfit.slice(0, 3),
            allWithProfit: itemsWithProfit
        };
    }, [portfolio, prices, currency]); // Recalculate if currency changes

    // Check for Alerts
    const [isAlertsArmed, setIsAlertsArmed] = useState(false);

    // Arm alerts after 60 seconds to avoid initial load spam
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsAlertsArmed(true);
        }, 60000); // 1 minute delay
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!stats || !isAlertsArmed) return;

        // Check for High Loss (Total Profit vs Buy Price)
        const lossItem = stats.allWithProfit.find(item =>
            item.profitPercent <= -lossThreshold && !dismissedAlerts.has(item.id)
        );

        if (lossItem) {
            setAlertItem({ ...lossItem, type: 'loss' });
            return;
        }

        // Check for High Gain (Total Profit vs Buy Price)
        const gainItem = stats.allWithProfit.find(item =>
            item.profitPercent >= gainThreshold && !dismissedAlerts.has(item.id)
        );

        if (gainItem) {
            setAlertItem({ ...gainItem, type: 'gain' });
        }

    }, [stats, dismissedAlerts, lossThreshold, gainThreshold, isAlertsArmed]);

    const handleDismissAlert = () => {
        if (alertItem) {
            setDismissedAlerts(prev => new Set(prev).add(alertItem.id));
            setAlertItem(null);
        }
    };

    return (
        <div className="space-y-6">
            <SmartAlert
                item={alertItem}
                onClose={handleDismissAlert}
            />
            {/* Portfolio Selector */}
            {portfolios && portfolios.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {portfolios.map(p => (
                        <button
                            key={p.id}
                            onClick={() => onSelectPortfolio(p.id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activePortfolioId === p.id
                                ? 'bg-gradient-to-r from-cs-blue to-cs-purple text-white shadow-lg shadow-cs-blue/20'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Main Stats Card */}
            <div className="bg-gradient-to-br from-cs-blue/20 to-cs-purple/20 rounded-2xl p-6 border border-white/10 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <DollarSign size={100} />
                </div>

                <div className="relative z-10">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">{t('total_balance')}</h2>
                            <div className="text-4xl font-bold text-white mb-4 tracking-tight">
                                {formatPrice(stats.totalValue)}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-xs text-gray-500 mb-1">{t('total_invested')}</div>
                            <div className="font-semibold text-gray-200">{formatPrice(stats.totalInvested)}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 mb-1">{t('profit_loss')}</div>
                            <div className={clsx("font-semibold flex items-center gap-1", stats.totalProfit >= 0 ? "text-green-400" : "text-red-400")}>
                                {stats.totalProfit >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                {stats.totalProfitPercent.toFixed(2)}%
                            </div>
                            <div className={clsx("text-xs", stats.totalProfit >= 0 ? "text-green-500/70" : "text-red-500/70")}>
                                ({stats.totalProfit >= 0 ? '+' : ''}{formatPrice(stats.totalProfit)})
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="text-gray-400 text-xs uppercase">{t('items')}</div>
                    <div className="text-2xl font-bold mt-1">{portfolio.items.length}</div>
                    <div className="text-xs text-gray-500">{t('assets')}</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="text-gray-400 text-xs uppercase">ROI</div>
                    <div className={clsx("text-2xl font-bold mt-1", stats.totalProfitPercent >= 0 ? "text-green-400" : "text-red-400")}>
                        {stats.totalProfitPercent > 0 ? '+' : ''}{stats.totalProfitPercent.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">Return on Investment</div>
                </div>
            </div>

            {/* Top Movers */}
            <div>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <TrendingUp className="text-cs-blue" size={20} />
                    {t('top_movers')}
                </h3>
                <div className="space-y-3">
                    {stats.topMovers.length > 0 ? (
                        stats.topMovers.map(item => (
                            <div key={item.id} className="bg-white/5 rounded-xl p-3 flex items-center justify-between border border-white/5 hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={clsx("w-1 h-8 rounded-full", item.profit >= 0 ? "bg-green-500" : "bg-red-500")}></div>
                                    <div className="truncate">
                                        <div className="font-medium text-sm truncate w-32 md:w-48">{item.name}</div>
                                        <div className="text-xs text-gray-500">{formatPrice(item.currentPrice)}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={clsx("font-bold text-sm", item.profit >= 0 ? "text-green-400" : "text-red-400")}>
                                        {item.profit >= 0 ? '+' : ''}{item.profitPercent.toFixed(2)}%
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {item.profit >= 0 ? '+' : ''}{formatPrice(item.profit)}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-gray-500 py-4 text-sm">{t('portfolio_empty')}</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
