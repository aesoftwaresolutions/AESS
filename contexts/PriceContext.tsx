import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { coinbaseWS, TickerData, WSStatus } from '../services/websocket';
import { getWatchlist } from '../services/news';

interface PriceContextValue {
  /** Live ticker data keyed by product ID */
  prices: Record<string, TickerData>;
  wsStatus: WSStatus;
  /** Subscribe additional product IDs to live ticker feed */
  subscribe: (productIds: string[]) => void;
  /** Unsubscribe product IDs */
  unsubscribe: (productIds: string[]) => void;
}

const PriceContext = createContext<PriceContextValue>({
  prices: {},
  wsStatus: 'closed',
  subscribe: () => {},
  unsubscribe: () => {},
});

export const PriceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [prices, setPrices] = useState<Record<string, TickerData>>({});
  const [wsStatus, setWsStatus] = useState<WSStatus>('closed');
  const cleanupRefs = useRef<Array<() => void>>([]);

  useEffect(() => {
    // Start WebSocket and subscribe to watchlist
    coinbaseWS.connect();
    coinbaseWS.subscribe(getWatchlist());

    const unsubTicker = coinbaseWS.onTicker((data: TickerData) => {
      setPrices((prev) => ({ ...prev, [data.productId]: data }));
    });

    const unsubStatus = coinbaseWS.onStatus((s: WSStatus) => setWsStatus(s));

    cleanupRefs.current = [unsubTicker, unsubStatus];

    return () => {
      cleanupRefs.current.forEach((fn) => fn());
      // Don't disconnect WS on unmount – PriceProvider wraps the whole app
    };
  }, []);

  const subscribe = useCallback((productIds: string[]) => {
    coinbaseWS.subscribe(productIds);
  }, []);

  const unsubscribe = useCallback((productIds: string[]) => {
    coinbaseWS.unsubscribe(productIds);
  }, []);

  return (
    <PriceContext.Provider value={{ prices, wsStatus, subscribe, unsubscribe }}>
      {children}
    </PriceContext.Provider>
  );
};

export function usePrices(): PriceContextValue {
  return useContext(PriceContext);
}
