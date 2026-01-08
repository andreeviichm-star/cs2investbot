import React from 'react';
import { TrendingDown, TrendingUp, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

const SmartAlert = ({ item, onClose, onAverageDown, onSell }) => {
    const { t } = useTranslation();

    if (!item) return null;

    const isGain = item.type === 'gain';

    return (
        <div className="absolute top-4 left-4 right-4 z-50 animate-in slide-in-from-top-4 duration-300">
            <div className={clsx(
                "rounded-xl p-4 shadow-2xl border flex items-start gap-4",
                isGain ? "bg-green-500/20 border-green-500/50 backdrop-blur-xl" : "bg-red-500/20 border-red-500/50 backdrop-blur-xl"
            )}>
                <div className={clsx(
                    "p-2 rounded-full",
                    isGain ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                )}>
                    {isGain ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                </div>
                <div>
                    <h3 className="font-bold text-white text-lg leading-tight mb-1">
                        {isGain ? t('alert_high_gain') : t('alert_high_loss')}
                    </h3>
                    <p className="text-sm text-gray-300 mb-3">
                        <span className="font-bold text-white">{item.name}</span> {isGain ? t('alert_up') : t('alert_down')} <span className={clsx("font-bold", isGain ? "text-green-400" : "text-red-400")}>{Math.abs(item.profitPercent).toFixed(1)}%</span>.
                    </p>
                </div>
                <button onClick={onClose} className="ml-auto text-gray-400 hover:text-white">
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};

export default SmartAlert;
