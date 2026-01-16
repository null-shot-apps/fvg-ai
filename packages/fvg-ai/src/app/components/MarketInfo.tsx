'use client';

import { MarketBias, Timeframe } from '@/types/trading';

interface MarketInfoProps {
  symbol: string;
  timeframe: Timeframe;
  bias: MarketBias;
  currentPrice: number;
  fvgCount: number;
}

export default function MarketInfo({ 
  symbol, 
  bias, 
  currentPrice,
  fvgCount 
}: MarketInfoProps) {
  const biasColor: Record<MarketBias, string> = {
    bullish: 'text-green-500',
    bearish: 'text-red-500',
    neutral: 'text-gray-400',
  };
  const selectedBiasColor = biasColor[bias];

  const biasIcon: Record<MarketBias, string> = {
    bullish: '↑',
    bearish: '↓',
    neutral: '→',
  };
  const selectedBiasIcon = biasIcon[bias];

  return (
    <div className="flex items-center gap-6 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-zinc-400">Symbol:</span>
        <span className="text-white font-semibold">{symbol}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-zinc-400">Price:</span>
        <span className="text-white font-mono">${currentPrice.toLocaleString()}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-zinc-400">HTF Bias:</span>
        <span className={`font-semibold ${selectedBiasColor} flex items-center gap-1`}>
          <span>{selectedBiasIcon}</span>
          <span className="uppercase">{bias}</span>
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-zinc-400">Active FVGs:</span>
        <span className="text-white font-semibold">{fvgCount}</span>
      </div>
    </div>
  );
}


