import React, { useState, useEffect } from 'react';
import { Key, Shield, CheckCircle, XCircle, Loader, Trash2, ExternalLink, Plus, X } from 'lucide-react';
import * as coinbase from '../services/coinbase';
import {
  getCryptoPanicToken, saveCryptoPanicToken,
  getWatchlist, saveWatchlist,
} from '../services/news';

type Status = 'idle' | 'testing' | 'ok' | 'error';

const Settings: React.FC = () => {
  // ── Coinbase credentials ─────────────────────────────────────────────────
  const [keyName, setKeyName] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [saved, setSaved] = useState(false);

  // ── CryptoPanic token ────────────────────────────────────────────────────
  const [cpToken, setCpToken] = useState('');
  const [cpSaved, setCpSaved] = useState(false);

  // ── Watchlist management ─────────────────────────────────────────────────
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [newPair, setNewPair] = useState('');

  useEffect(() => {
    const creds = coinbase.getCredentials();
    if (creds) { setKeyName(creds.apiKeyName); setPrivateKey(creds.privateKey); setSaved(true); }
    const token = getCryptoPanicToken();
    if (token) { setCpToken(token); setCpSaved(true); }
    setWatchlist(getWatchlist());
  }, []);

  // ── Coinbase handlers ────────────────────────────────────────────────────
  const handleSave = () => {
    if (!keyName.trim() || !privateKey.trim()) return;
    coinbase.saveCredentials(keyName.trim(), privateKey.trim());
    setSaved(true);
    setStatus('idle');
  };

  const handleTest = async () => {
    if (!keyName.trim() || !privateKey.trim()) return;
    coinbase.saveCredentials(keyName.trim(), privateKey.trim());
    setSaved(true);
    setStatus('testing');
    setErrorMsg('');
    try {
      await coinbase.testConnection();
      setStatus('ok');
    } catch (e: unknown) {
      setStatus('error');
      setErrorMsg(e instanceof Error ? e.message : String(e));
    }
  };

  const handleClear = () => {
    coinbase.clearCredentials();
    setKeyName(''); setPrivateKey(''); setSaved(false); setStatus('idle'); setErrorMsg('');
  };

  // ── CryptoPanic handlers ─────────────────────────────────────────────────
  const handleCpSave = () => {
    saveCryptoPanicToken(cpToken.trim());
    setCpSaved(true);
  };

  const handleCpClear = () => {
    saveCryptoPanicToken('');
    setCpToken('');
    setCpSaved(false);
  };

  // ── Watchlist handlers ────────────────────────────────────────────────────
  const handleAddPair = () => {
    const pid = newPair.trim().toUpperCase();
    if (!pid || watchlist.includes(pid)) return;
    const updated = [...watchlist, pid];
    setWatchlist(updated);
    saveWatchlist(updated);
    setNewPair('');
  };

  const handleRemovePair = (pid: string) => {
    const updated = watchlist.filter((p) => p !== pid);
    setWatchlist(updated);
    saveWatchlist(updated);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
        <p className="text-slate-400 text-sm">Configure API credentials, news sources, and your watchlist.</p>
      </div>

      {/* ── How to get Coinbase keys ──────────────────────────────────────── */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
          <Shield size={16} /> How to get Coinbase API keys
        </div>
        <ol className="text-slate-300 text-sm space-y-2 list-decimal list-inside">
          <li>Log in to <strong>Coinbase Advanced Trade</strong> → <strong>Settings → API</strong>.</li>
          <li>Click <strong>New API Key</strong> and grant <em>View + Trade</em> permissions.</li>
          <li>Copy the <strong>Key Name</strong> (<code className="bg-slate-700 px-1 rounded text-xs">organizations/…/apiKeys/…</code>).</li>
          <li>Download the <strong>Private Key</strong> (PKCS8 — <code className="bg-slate-700 px-1 rounded text-xs">-----BEGIN PRIVATE KEY-----</code>).</li>
        </ol>
        <a href="https://www.coinbase.com/settings/api" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-sm font-medium">
          Open Coinbase API Settings <ExternalLink size={13} />
        </a>
      </div>

      {/* ── Coinbase credentials ──────────────────────────────────────────── */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-slate-200 font-semibold"><Key size={16} /> API Credentials</div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">API Key Name</label>
          <input type="text" value={keyName}
            onChange={(e) => { setKeyName(e.target.value); setSaved(false); setStatus('idle'); }}
            placeholder="organizations/xxx/apiKeys/yyy"
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500" />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Private Key (PKCS8 PEM)</label>
          <textarea rows={7} value={privateKey}
            onChange={(e) => { setPrivateKey(e.target.value); setSaved(false); setStatus('idle'); }}
            placeholder={'-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----'}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono resize-none" />
        </div>

        {status === 'ok' && (
          <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-900/30 border border-emerald-700 rounded-lg px-3 py-2">
            <CheckCircle size={15} /> Connection successful!
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-start gap-2 text-red-400 text-sm bg-red-900/30 border border-red-700 rounded-lg px-3 py-2">
            <XCircle size={15} className="flex-shrink-0 mt-0.5" />
            {errorMsg || 'Connection failed. Check your credentials.'}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button onClick={handleTest}
            disabled={!keyName.trim() || !privateKey.trim() || status === 'testing'}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold">
            {status === 'testing' ? <><Loader size={14} className="animate-spin" /> Testing…</> : 'Save & Test Connection'}
          </button>
          <button onClick={handleSave}
            disabled={!keyName.trim() || !privateKey.trim() || saved}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-semibold">
            {saved && <CheckCircle size={14} className="text-emerald-400" />}
            {saved ? 'Saved' : 'Save'}
          </button>
          {saved && (
            <button onClick={handleClear} className="flex items-center gap-2 text-slate-400 hover:text-red-400 px-3 py-2 rounded-lg text-sm">
              <Trash2 size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── CryptoPanic token ─────────────────────────────────────────────── */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <Key size={16} /> CryptoPanic API Token
            <span className="text-xs text-slate-500 font-normal">(optional — for news feed)</span>
          </div>
          <a href="https://cryptopanic.com/developers/api/" target="_blank" rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1">
            Get free token <ExternalLink size={11} />
          </a>
        </div>
        <input type="text" value={cpToken}
          onChange={(e) => { setCpToken(e.target.value); setCpSaved(false); }}
          placeholder="Your CryptoPanic auth token"
          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500" />
        <div className="flex gap-3">
          <button onClick={handleCpSave} disabled={!cpToken.trim() || cpSaved}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-semibold">
            {cpSaved && <CheckCircle size={14} className="text-emerald-400" />}
            {cpSaved ? 'Saved' : 'Save Token'}
          </button>
          {cpSaved && (
            <button onClick={handleCpClear} className="flex items-center gap-2 text-slate-400 hover:text-red-400 px-3 py-2 rounded-lg text-sm">
              <Trash2 size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Watchlist management ──────────────────────────────────────────── */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
        <div className="text-slate-200 font-semibold">Watchlist</div>
        <p className="text-slate-400 text-xs -mt-2">
          These pairs are tracked on the Sentinel page and subscribed to the live price feed.
          Add any Coinbase trading pair (e.g. <code className="bg-slate-700 px-1 rounded">ETH-USD</code>).
        </p>

        {/* Current watchlist */}
        <div className="flex flex-wrap gap-2">
          {watchlist.map((pid) => (
            <span key={pid} className="flex items-center gap-1.5 bg-slate-700 px-2.5 py-1 rounded-lg text-xs text-slate-200">
              {pid}
              <button onClick={() => handleRemovePair(pid)} className="text-slate-500 hover:text-red-400">
                <X size={11} />
              </button>
            </span>
          ))}
        </div>

        {/* Add new pair */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newPair}
            onChange={(e) => setNewPair(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddPair(); }}
            placeholder="e.g. PEPE-USD"
            className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleAddPair}
            disabled={!newPair.trim()}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-3 py-2 rounded-lg text-sm font-semibold"
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      {/* ── Security notice ───────────────────────────────────────────────── */}
      <div className="bg-amber-900/20 border border-amber-700/50 rounded-xl p-4 text-sm text-amber-300 space-y-1">
        <p className="font-semibold">Security notice</p>
        <p className="text-amber-400/80">
          All credentials are stored in your browser's <code className="bg-amber-900/40 px-1 rounded text-xs">localStorage</code> and
          sent only to Coinbase and CryptoPanic. Never grant withdrawal permissions to trading API keys.
        </p>
      </div>
    </div>
  );
};

export default Settings;
