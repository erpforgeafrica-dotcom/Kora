import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HierarchicalMenu from './components/navigation/HierarchicalMenu';
import CRMCustomersPage from './pages/crm/CRMCustomersPage';
import InventoryProductsPage from './pages/inventory/InventoryProductsPage';

const MainLayout: React.FC = () => {
  const [currentPath, setCurrentPath] = useState('/crm/customers');

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
  };

  const renderContent = () => {
    switch (currentPath) {
      case '/crm/customers':
        return <CRMCustomersPage />;
      case '/inventory/products':
        return <InventoryProductsPage />;
      default:
        return (
          <div className="p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {currentPath.replace(/\//g, ' > ').replace(/^>/, '').toUpperCase()}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                This page is under construction. Real CRUD operations will be implemented here.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-80 flex-shrink-0">
        <HierarchicalMenu onNavigate={handleNavigate} />
      </div>
      
      <div className="flex-1 overflow-auto">
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                KÓRA Platform
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Current: {currentPath}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Real Data Mode
              </span>
            </div>
          </div>
        </div>
        
        <main className="flex-1">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/app" replace />} />
        <Route path="/app/*" element={<MainLayout />} />
      </Routes>
    </Router>
  );
};

export default App;