import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
    const { i18n } = useTranslation();

    // Settings State
    const [language, setLanguage] = useState(() => localStorage.getItem('settings_language') || 'ru');
    const [currency, setCurrency] = useState(() => localStorage.getItem('settings_currency') || 'USD');
    const [exchangeRates, setExchangeRates] = useState({
        USD: 1,
        RUB: 100, // Legacy/Fallback
        KZT: 500
    });
    const [lossThreshold, setLossThreshold] = useState(50);
    const [gainThreshold, setGainThreshold] = useState(50);
    const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
        const stored = localStorage.getItem('settings_notifications');
        return stored !== null ? JSON.parse(stored) : true;
    });

    // Persist Notifications
    useEffect(() => {
        localStorage.setItem('settings_notifications', JSON.stringify(notificationsEnabled));
    }, [notificationsEnabled]);

    // Persist & Apply Language Change
    useEffect(() => {
        localStorage.setItem('settings_language', language);
        i18n.changeLanguage(language);
    }, [language, i18n]);

    // Persist Currency Change
    useEffect(() => {
        localStorage.setItem('settings_currency', currency);
    }, [currency]);

    // Fetch Rates
    useEffect(() => {
        const fetchRates = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/rates');
                const data = await response.json();
                if (data && data.RUB) {
                    setExchangeRates(data);
                }
            } catch (error) {
                console.error('Failed to load rates:', error);
            }
        };
        fetchRates();
        // Refresh every hour
        const interval = setInterval(fetchRates, 3600000);
        return () => clearInterval(interval);
    }, []);

    // Format Price Helper
    const formatPrice = (value, targetCurrency) => {
        if (value === null || value === undefined) return '...';

        return new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US', {
            style: 'currency',
            currency: targetCurrency || currency
        }).format(value);
    };

    const updateExchangeRate = (curr, rate) => {
        setExchangeRates(prev => ({
            ...prev,
            [curr]: parseFloat(rate)
        }));
    };

    const convertPrice = (price, fromCurrency, toCurrency) => {
        if (!price || !fromCurrency || !toCurrency) return 0;
        if (fromCurrency === toCurrency) return price;

        // Convert to USD (Base) then to Target
        const priceInUSD = fromCurrency === 'USD' ? price : price / exchangeRates[fromCurrency];
        const result = toCurrency === 'USD' ? priceInUSD : priceInUSD * exchangeRates[toCurrency];

        return result;
    };

    return (
        <SettingsContext.Provider value={{
            language,
            setLanguage,
            currency,
            setCurrency,
            exchangeRates, // Kept for UI compatibility but unused logic
            updateExchangeRate,
            formatPrice,

            convertPrice,
            lossThreshold,
            setLossThreshold,
            gainThreshold,
            setGainThreshold,
            notificationsEnabled,
            setNotificationsEnabled
        }}>
            {children}
        </SettingsContext.Provider>
    );
};
