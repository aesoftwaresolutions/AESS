import React, { useState, useEffect } from 'react';
import { Key, Shield, CheckCircle, XCircle, Loader, Trash2, ExternalLink } from 'lucide-react';
import * as coinbase from '../services/coinbase';

type Status = 'idle' | 'testing' | 'ok' | 'error';

const Settings: React.FC = () => {
  const [keyName, setKeyName] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const creds = coinbase.getCredentials();
    if (creds) {
      setKeyName(creds.apiKeyName);
      setPrivateKey(creds.privateKey);
      setSaved(true);
    }
  }, []);

  const handleSave = () => {
    if (!keyName.trim() || !privateKey.trim()) return;
    coinbase.saveCredentials(keyName.trim(), privateKey.trim());
    setSaved(true);
    setStatus('idle');
  };

  const handleTest = async () => {
    if (!keyName.trim() || !privateKey.trim()) return;
    // Save first so the service can use them
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
    setKeyName('');
    setPrivateKey('');
    setSaved(false);
    setStatus('idle');
    setErrorMsg('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
        <p className="text-slate-400 text-sm">Configure your Coinbase Advanced Trade API credentials.</p>
      </div>

      {/* How to get keys */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
          <Shield size={16} />
          How to get your API keys
        </div>
        <ol className="text-slate-300 text-sm space-y-2 list-decimal list-inside">
          <li>
            Log in to{' '}
            <span className="text-blue-400 font-medium">Coinbase Advanced Trade</span> and open{' '}
            <strong>Settings → API</strong>.
          </li>
          <li>Click <strong>New API Key</strong> and grant the permissions you need (View + Trade).</li>
          <li>
            Copy the <strong>Key Name</strong> (format:{' '}
            <code className="bg-slate-700 px-1 rounded text-xs">organizations/…/apiKeys/…</code>).
          </li>
          <li>
            Download the <strong>Private Key</strong> — it must be in PKCS8 format (
            <code className="bg-slate-700 px-1 rounded text-xs">-----BEGIN PRIVATE KEY-----</code>).
          </li>
          <li>Paste both below and click <strong>Save &amp; Test</strong>.</li>
        </ol>
        <a
          href="https://www.coinbase.com/settings/api"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-sm font-medium"
        >
          Open Coinbase API Settings <ExternalLink size={13} />
        </a>
      </div>

      {/* Credentials form */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-slate-200 font-semibold">
          <Key size={16} />
          API Credentials
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
            API Key Name
          </label>
          <input
            type="text"
            value={keyName}
            onChange={(e) => { setKeyName(e.target.value); setSaved(false); setStatus('idle'); }}
            placeholder="organizations/xxx/apiKeys/yyy"
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
            Private Key (PKCS8 PEM)
          </label>
          <textarea
            rows={8}
            value={privateKey}
            onChange={(e) => { setPrivateKey(e.target.value); setSaved(false); setStatus('idle'); }}
            placeholder={'-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----'}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono resize-none"
          />
        </div>

        {/* Status feedback */}
        {status === 'ok' && (
          <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-900/30 border border-emerald-700 rounded-lg px-3 py-2">
            <CheckCircle size={15} />
            Connection successful! Your credentials are valid.
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-start gap-2 text-red-400 text-sm bg-red-900/30 border border-red-700 rounded-lg px-3 py-2">
            <XCircle size={15} className="flex-shrink-0 mt-0.5" />
            <span>{errorMsg || 'Connection failed. Check your credentials.'}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={handleTest}
            disabled={!keyName.trim() || !privateKey.trim() || status === 'testing'}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            {status === 'testing' ? (
              <>
                <Loader size={14} className="animate-spin" />
                Testing…
              </>
            ) : (
              'Save & Test Connection'
            )}
          </button>

          <button
            onClick={handleSave}
            disabled={!keyName.trim() || !privateKey.trim() || saved}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            {saved ? <CheckCircle size={14} className="text-emerald-400" /> : null}
            {saved ? 'Saved' : 'Save'}
          </button>

          {saved && (
            <button
              onClick={handleClear}
              className="flex items-center gap-2 text-slate-400 hover:text-red-400 px-3 py-2 rounded-lg text-sm transition-colors"
            >
              <Trash2 size={14} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Security note */}
      <div className="bg-amber-900/20 border border-amber-700/50 rounded-xl p-4 text-sm text-amber-300 space-y-1">
        <p className="font-semibold">Security notice</p>
        <p className="text-amber-400/80">
          Your API credentials are stored in your browser's <code className="bg-amber-900/40 px-1 rounded text-xs">localStorage</code>.
          This app runs locally in your browser and credentials are never sent to any server other than Coinbase.
          Do not use API keys with withdrawal permissions.
        </p>
      </div>
    </div>
  );
};

export default Settings;
