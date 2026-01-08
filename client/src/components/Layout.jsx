
import React from 'react';
import { LayoutDashboard, List, Settings as SettingsIcon, Activity } from 'lucide-react';
import clsx from 'clsx';

const NavItem = ({ icon: Icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={clsx(
            "flex flex-col items-center justify-center w-full py-2 transition-colors",
            active ? "text-cs-blue" : "text-gray-400 hover:text-white"
        )}
    >
        <Icon size={24} />
        <span className="text-xs mt-1">{label}</span>
    </button>
);

import { useTranslation } from 'react-i18next';

const Layout = ({ children, activeTab, onTabChange }) => {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col h-screen bg-cs-dark text-white max-w-md mx-auto relative overflow-hidden shadow-2xl">
            <header className="p-4 bg-cs-darker border-b border-white/5 flex items-center justify-between">
                <h1 className="text-xl font-bold bg-gradient-to-r from-cs-blue to-cs-purple bg-clip-text text-transparent">
                    CS2 Invest
                </h1>
                <div className="text-xs text-gray-500">v1.1</div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 pb-20 scrollbar-hide">
                {children}
            </main>

            <nav className="absolute bottom-0 left-0 right-0 z-50 bg-cs-darker border-t border-white/5 flex justify-around pb-safe">
                <NavItem
                    icon={LayoutDashboard}
                    label={t('dashboard')}
                    active={activeTab === 'dashboard'}
                    onClick={() => onTabChange('dashboard')}
                />
                <NavItem
                    icon={Activity}
                    label={t('overview')}
                    active={activeTab === 'overview'}
                    onClick={() => onTabChange('overview')}
                />
                <NavItem
                    icon={List}
                    label={t('portfolio')}
                    active={activeTab === 'list'}
                    onClick={() => onTabChange('list')}
                />
                <NavItem
                    icon={SettingsIcon}
                    label={t('settings')}
                    active={activeTab === 'settings'}
                    onClick={() => onTabChange('settings')}
                />
            </nav>
        </div>
    );
};

export default Layout;
