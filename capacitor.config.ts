import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aesoftware.trade',
  appName: 'AESS Trade',
  webDir: 'dist',
  // Use native HTTP layer on iOS/Android – this routes fetch() through the
  // native networking stack and completely bypasses WebView CORS restrictions.
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
  ios: {
    contentInset: 'always',  // respect safe-area on notched iPhones
    backgroundColor: '#0f172a',
    scheme: 'aessTrade',
    // Allow Coinbase WebSocket and all data sources
    allowNavigation: [
      'api.coinbase.com',
      'advanced-trade-ws.coinbase.com',
      'www.reddit.com',
      'reddit.com',
      'api.coingecko.com',
      'api.alternative.me',
      'cryptopanic.com',
    ],
  },
  server: {
    // During development with `npx cap run ios`, point at Vite dev server
    // so you get HMR on a real device. Comment this out for a production build.
    // url: 'http://YOUR_LOCAL_IP:3000',
    // cleartext: true,
  },
};

export default config;
