import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { PriceProvider } from './contexts/PriceContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Sentinel from './pages/Sentinel';
import Trading from './pages/Trading';
import News from './pages/News';
import Portfolio from './pages/Portfolio';
import Orders from './pages/Orders';
import Settings from './pages/Settings';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

const App: React.FC = () => (
  <Router>
    <PriceProvider>
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sentinel" element={<Sentinel />} />
          <Route path="/trading" element={<Trading />} />
          <Route path="/news" element={<News />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </PriceProvider>
  </Router>
);

export default App;
