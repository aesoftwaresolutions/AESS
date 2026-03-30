import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  ClipboardList,
  Settings,
  Menu,
  X,
  CircleDot,
} from 'lucide-react';
import { getCredentials } from '../services/coinbase';
import { APP_NAME } from '../constants';

const navItems = [
  { path: '/',          label: 'Dashboard',  Icon: LayoutDashboard },
  { path: '/trading',   label: 'Trading',    Icon: TrendingUp },
  { path: '/portfolio', label: 'Portfolio',  Icon: Wallet },
  { path: '/orders',    label: 'Orders',     Icon: ClipboardList },
  { path: '/settings',  label: 'Settings',   Icon: Settings },
];

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const connected = !!getCredentials();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
          AE
        </div>
        <span className="font-bold text-white tracking-tight">{APP_NAME}</span>
      </div>

      {/* Connection badge */}
      <div className="px-5 py-3 border-b border-slate-700">
        <div className={`flex items-center gap-2 text-xs font-medium ${connected ? 'text-emerald-400' : 'text-slate-400'}`}>
          <CircleDot size={12} className={connected ? 'text-emerald-400' : 'text-slate-500'} />
          {connected ? 'Connected to Coinbase' : 'Not connected'}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ path, label, Icon }) => {
          const active = path === '/' ? pathname === '/' : pathname.startsWith(path);
          return (
            <Link
              key={path}
              to={path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-700 text-xs text-slate-500">
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

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-56 bg-slate-800 border-r border-slate-700 z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-slate-800 border-b border-slate-700">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-white"
          >
            <Menu size={22} />
          </button>
          <span className="font-bold text-white">{APP_NAME}</span>
          <div className="ml-auto">
            <CircleDot size={14} className={connected ? 'text-emerald-400' : 'text-slate-500'} />
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
