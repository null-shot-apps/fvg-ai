'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Candle, FVG, Timeframe, MarketBias } from '@/types/trading';
import { fetchMarketData, getWebSocketUrl } from '@/lib/marketData';
import { calculateMarketBias, detectFVGs, updateFVGStatus, checkFVGEntry } from '@/lib/fvgDetection';

interface UseTradingDataProps {
  symbol?: string;
  timeframe: Timeframe;
  higherTimeframe: Timeframe;
}

export function useTradingData({ 
  symbol = 'BTCUSDT', 
  timeframe,
  higherTimeframe 
}: UseTradingDataProps) {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [htfCandles, setHtfCandles] = useState<Candle[]>([]);
  const [fvgs, setFvgs] = useState<FVG[]>([]);
  const [marketBias, setMarketBias] = useState<MarketBias>('neutral');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const prevFvgsRef = useRef<FVG[]>([]);

  // Fetch initial data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch both timeframes
      const [candleData, htfData] = await Promise.all([
        fetchMarketData(symbol, timeframe),
        fetchMarketData(symbol, higherTimeframe),
      ]);

      setCandles(candleData);
      setHtfCandles(htfData);

      // Calculate bias from higher timeframe
      const bias = calculateMarketBias(htfData);
      setMarketBias(bias);

      // Detect FVGs on lower timeframe aligned with HTF bias
      const detectedFvgs = detectFVGs(candleData, bias);
      setFvgs(detectedFvgs);
      prevFvgsRef.current = detectedFvgs;

      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setIsLoading(false);
    }
  }, [symbol, timeframe, higherTimeframe]);

  // Setup WebSocket for real-time updates
  useEffect(() => {
    loadData();

    // Connect to WebSocket
    const wsUrl = getWebSocketUrl(symbol, timeframe);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const kline = data.k;

        if (!kline) return;

        const newCandle: Candle = {
          time: kline.t,
          open: parseFloat(kline.o),
          high: parseFloat(kline.h),
          low: parseFloat(kline.l),
          close: parseFloat(kline.c),
          volume: parseFloat(kline.v),
        };

        setCandles(prev => {
          const updated = [...prev];
          
          // If candle is closed, add new one, otherwise update last
          if (kline.x) {
            updated.push(newCandle);
            // Keep only last 200 candles
            if (updated.length > 200) {
              updated.shift();
            }
          } else {
            updated[updated.length - 1] = newCandle;
          }

          // Recalculate FVGs with updated data
          const updatedFvgs = detectFVGs(updated, marketBias);
          const finalFvgs = updateFVGStatus(updatedFvgs, updated);
          
          // Check for FVG entry alerts
          const currentPrice = newCandle.close;
          finalFvgs.forEach((fvg: FVG) => {
            if (!fvg.filled && fvg.alignedWithBias) {
              const wasInZone = prevFvgsRef.current.some(
                prevFvg => prevFvg.id === fvg.id && checkFVGEntry(prev[prev.length - 2] || prev[prev.length - 1], prevFvg)
              );
              const isInZone = checkFVGEntry(newCandle, fvg);
              
              if (isInZone && !wasInZone) {
                setAlert(`🎯 Price entered ${fvg.type.toUpperCase()} FVG zone at $${currentPrice.toLocaleString()}`);
                
                // Clear alert after 5 seconds
                setTimeout(() => setAlert(null), 5000);
              }
            }
          });
          
          setFvgs(finalFvgs);
          prevFvgsRef.current = finalFvgs;

          return updated;
        });
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Real-time connection error');
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [symbol, timeframe, higherTimeframe, loadData, marketBias]);

  // Refresh HTF data periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const htfData = await fetchMarketData(symbol, higherTimeframe);
        setHtfCandles(htfData);
        
        const bias = calculateMarketBias(htfData);
        setMarketBias(bias);
        
        // Recalculate FVGs with new bias
        const updatedFvgs = detectFVGs(candles, bias);
        setFvgs(updateFVGStatus(updatedFvgs, candles));
      } catch (err) {
        console.error('Failed to refresh HTF data:', err);
      }
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [symbol, higherTimeframe, candles]);

  return {
    candles,
    htfCandles,
    fvgs,
    marketBias,
    isLoading,
    error,
    alert,
    refresh: loadData,
  };
}


