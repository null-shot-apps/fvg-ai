'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Timeframe, FVG } from '@/types/trading';
import { useTradingData } from '@/hooks/useTradingData';
import TimeframeSelector from '@/components/TimeframeSelector';
import MarketInfo from '@/components/MarketInfo';
import FVGList from '@/components/FVGList';

// Dynamic import to avoid SSR issues with lightweight-charts
const TradingChart = dynamic(() => import('@/components/TradingChart'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-zinc-900 rounded-lg">
      <div className="text-zinc-400">Loading chart...</div>
    </div>
  ),
});

const TIMEFRAME_MAP: Record<Timeframe, Timeframe> = {
  '15m': '4h',
  '1h': '1d',
  '4h': '1d',
  '1d': '1d',
};

export default function TradingApp() {
  const [timeframe, setTimeframe] = useState<Timeframe>('15m');
  const symbol = 'BTCUSDT';
  
  const higherTimeframe = TIMEFRAME_MAP[timeframe];
  
  const {
    candles,
    fvgs,
    marketBias,
    isLoading,
    error,
    alert,
  } = useTradingData({
    symbol,
    timeframe,
    higherTimeframe,
  });

  const currentPrice = candles.length > 0 ? candles[candles.length - 1].close : 0;
  const activeFvgCount = fvgs.filter((fvg: FVG) => !fvg.filled && fvg.alignedWithBias).length;

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-2">Error</h2>
          <p className="text-zinc-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Alert Banner */}
      {alert && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg px-6 py-3 shadow-lg shadow-yellow-500/20">
            <p className="text-yellow-400 font-semibold">{alert}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">FVG Trading</h1>
              <p className="text-sm text-zinc-500">Fair Value Gap Detection</p>
            </div>
            
            <TimeframeSelector selected={timeframe} onChange={setTimeframe} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-[600px]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-zinc-400">Loading market data...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Market Info */}
            <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
              <MarketInfo
                symbol={symbol}
                timeframe={timeframe}
                bias={marketBias}
                currentPrice={currentPrice}
                fvgCount={activeFvgCount}
              />
            </div>

            {/* Chart and FVG List */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart */}
              <div className="lg:col-span-2 bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
                <div className="h-[600px]">
                  <TradingChart
                    candles={candles}
                    fvgs={fvgs}
                    timeframe={timeframe}
                    symbol={symbol}
                  />
                </div>
              </div>

              {/* FVG List */}
              <div className="lg:col-span-1">
                <FVGList fvgs={fvgs} currentPrice={currentPrice} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

