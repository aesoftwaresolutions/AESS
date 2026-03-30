import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        // Coinbase Advanced Trade REST API
        '/api': {
          target: 'https://api.coinbase.com',
          changeOrigin: true,
          secure: true,
        },
        // Alternative.me Fear & Greed Index
        '/feargreed': {
          target: 'https://api.alternative.me',
          changeOrigin: true,
          secure: true,
          rewrite: (p) => p.replace(/^\/feargreed/, ''),
        },
        // Reddit JSON API (public, no auth)
        '/reddit': {
          target: 'https://www.reddit.com',
          changeOrigin: true,
          secure: true,
          rewrite: (p) => p.replace(/^\/reddit/, ''),
        },
        // CryptoPanic news API
        '/cryptopanic': {
          target: 'https://cryptopanic.com',
          changeOrigin: true,
          secure: true,
          rewrite: (p) => p.replace(/^\/cryptopanic/, ''),
        },
        // CoinGecko public API (free tier)
        '/coingecko': {
          target: 'https://api.coingecko.com',
          changeOrigin: true,
          secure: true,
          rewrite: (p) => p.replace(/^\/coingecko/, ''),
        },
      },
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
