import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, TrendingUp, Wallet, ClipboardList,
  Settings, Menu, Newspaper, Shield, Wifi, WifiOff,
} from 'lucide-react';
import { getCredentials } from '../services/coinbase';
import { usePrices } from '../contexts/PriceContext';
import { APP_NAME } from '../constants';

const navItems = [
  { path: '/',          label: 'Dashboard', Icon: LayoutDashboard },
  { path: '/sentinel',  label: 'Sentinel',  Icon: Shield },
  { path: '/trading',   label: 'Trading',   Icon: TrendingUp },
  { path: '/news',      label: 'News',      Icon: Newspaper },
  { path: '/portfolio', label: 'Portfolio', Icon: Wallet },
  { path: '/orders',    label: 'Orders',    Icon: ClipboardList },
  { path: '/settings',  label: 'Settings',  Icon: Settings },
];

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const connected = !!getCredentials();
  const { wsStatus } = usePrices();

  const wsIcon =
    wsStatus === 'open' ? <Wifi size={12} className="text-emerald-400" /> :
    wsStatus === 'connecting' ? <Wifi size={12} className="text-yellow-400" /> :
    <WifiOff size={12} className="text-slate-500" />;

  const wsLabel =
    wsStatus === 'open' ? 'Live' :
    wsStatus === 'connecting' ? 'Connecting…' :
    'Offline';

  const wsColor =
    wsStatus === 'open' ? 'text-emerald-400' :
    wsStatus === 'connecting' ? 'text-yellow-400' :
    'text-slate-500';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          AE
        </div>
        <span className="font-bold text-white tracking-tight">{APP_NAME}</span>
      </div>

      {/* Status row */}
      <div className="px-5 py-3 border-b border-slate-700 flex items-center justify-between">
        <div className={`flex items-center gap-1.5 text-xs font-medium ${wsColor}`}>
          {wsIcon} {wsLabel}
        </div>
        <div className={`flex items-center gap-1 text-xs ${connected ? 'text-emerald-400' : 'text-slate-500'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-slate-600'}`} />
          {connected ? 'API connected' : 'No keys'}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ path, label, Icon }) => {
          const active = path === '/' ? pathname === '/' : pathname.startsWith(path);
          return (
            <Link key={path} to={path} onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}>
              <Icon size={17} />
              {label}
              {label === 'Sentinel' && wsStatus === 'open' && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-slate-700 text-xs text-slate-600">
        Powered by Coinbase Advanced Trade API
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0 bg-slate-800 border-r border-slate-700">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-56 bg-slate-800 border-r border-slate-700 z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-slate-800 border-b border-slate-700">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-400 hover:text-white">
            <Menu size={22} />
          </button>
          <span className="font-bold text-white">{APP_NAME}</span>
          <div className={`ml-auto flex items-center gap-1 text-xs ${wsColor}`}>
            {wsIcon} {wsLabel}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
