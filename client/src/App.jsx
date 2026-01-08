import React, { useState, useEffect } from 'react';
import { useSettings } from './contexts/SettingsContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AddItem from './components/AddItem';
import PortfolioList from './components/PortfolioList';
import Overview from './components/Overview';
import Settings from './components/Settings';
import { getPortfolios, getPrice } from './services/api';

const USER_ID = 'test-user-1';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddingItem, setIsAddingItem] = useState(false);

  // State for multiple portfolios
  const [portfolios, setPortfolios] = useState([]);
  const [activePortfolioId, setActivePortfolioId] = useState(null);

  const [prices, setPrices] = useState({});
  const { currency } = useSettings();

  const loadPortfolios = async () => {
    const list = await getPortfolios(USER_ID);
    setPortfolios(list);

    // Set default active if none
    if (list.length > 0 && !activePortfolioId) {
      setActivePortfolioId(list[0].id);
    }
  };

  const getActivePortfolio = () => {
    return portfolios.find(p => p.id === activePortfolioId) || { items: [] };
  };

  const loadPrices = async () => {
    const currentPortfolio = getActivePortfolio();
    if (!currentPortfolio.items.length) return;

    const newPrices = {};
    for (const item of currentPortfolio.items) {
      // Pass the selected currency to the API
      // Check if we already have a valid price cache locally to avoid spamming
      if (prices[item.name]?.currency === currency) {
        // keep existing if fresh? (impl later)
      }

      const data = await getPrice(item.name, currency);
      if (data && data.success) {
        newPrices[item.name] = {
          price: data.price,
          currency: data.currency
        };
      }
    }
    setPrices(prev => ({ ...prev, ...newPrices }));
  };

  useEffect(() => {
    loadPortfolios();
  }, []);

  const handleItemAdded = async () => {
    await loadPortfolios();
    setIsAddingItem(false);
  };

  useEffect(() => {
    loadPrices();
    const interval = setInterval(loadPrices, 60000); // 1 min update
    return () => clearInterval(interval);
  }, [activePortfolioId, currency, portfolios.length]); // Reload on change

  return (
    <Layout activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); setIsAddingItem(false); }}>
      {isAddingItem ? (
        <div className="absolute inset-0 z-50 bg-cs-dark h-full flex flex-col p-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setIsAddingItem(false)}
              className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-full"
            >
              Close
            </button>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <AddItem
              userId={USER_ID}
              portfolios={portfolios}
              activePortfolioId={activePortfolioId}
              onAdd={handleItemAdded}
            />
          </div>
        </div>
      ) : (
        <>
          {activeTab === 'dashboard' && (
            <Dashboard
              portfolio={getActivePortfolio()}
              prices={prices}
              portfolios={portfolios}
              activePortfolioId={activePortfolioId}
              onSelectPortfolio={setActivePortfolioId}
              onAddClick={() => setIsAddingItem(true)}
            />
          )}
          {activeTab === 'overview' && (
            <Overview
              portfolios={portfolios}
              prices={prices}
            />
          )}
          {activeTab === 'list' && (
            <PortfolioList
              userId={USER_ID}
              portfolio={getActivePortfolio()}
              prices={prices}
              portfolios={portfolios}
              activePortfolioId={activePortfolioId}
              onSelectPortfolio={setActivePortfolioId}
              onUpdate={loadPortfolios}
              onAddClick={() => setIsAddingItem(true)}
            />
          )}
          {activeTab === 'settings' && (
            <Settings
              userId={USER_ID}
              portfolios={portfolios}
              onUpdate={loadPortfolios}
            />
          )}
        </>
      )}
    </Layout>
  );
}

export default App;
