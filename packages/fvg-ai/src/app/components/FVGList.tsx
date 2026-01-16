'use client';

import { FVG } from '@/types/trading';

interface FVGListProps {
  fvgs: FVG[];
  currentPrice: number;
}

export default function FVGList({ fvgs, currentPrice }: FVGListProps) {
  const activeFVGs = fvgs.filter(fvg => !fvg.filled && fvg.alignedWithBias);

  if (activeFVGs.length === 0) {
    return (
      <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
        <h3 className="text-lg font-semibold text-white mb-4">Active FVGs</h3>
        <p className="text-zinc-500 text-sm">No active FVGs aligned with market bias</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
      <h3 className="text-lg font-semibold text-white mb-4">
        Active FVGs ({activeFVGs.length})
      </h3>
      
      <div className="space-y-3">
        {activeFVGs.map(fvg => {
          const isInZone = currentPrice >= fvg.bottom && currentPrice <= fvg.top;
          const distance = isInZone 
            ? 0 
            : Math.min(
                Math.abs(currentPrice - fvg.top),
                Math.abs(currentPrice - fvg.bottom)
              );
          
          const distancePercent = ((distance / currentPrice) * 100).toFixed(2);

          return (
            <div
              key={fvg.id}
              className={`p-4 rounded-lg border transition-all ${
                isInZone
                  ? 'bg-yellow-500/10 border-yellow-500/50 shadow-lg shadow-yellow-500/20'
                  : fvg.type === 'bullish'
                  ? 'bg-green-500/5 border-green-500/30'
                  : 'bg-red-500/5 border-red-500/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      fvg.type === 'bullish'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {fvg.type === 'bullish' ? '↑ BULLISH' : '↓ BEARISH'}
                  </span>
                  
                  {isInZone && (
                    <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-500/20 text-yellow-400 animate-pulse">
                      🎯 IN ZONE
                    </span>
                  )}
                </div>
                
                <span className="text-xs text-zinc-500">
                  {distancePercent}% away
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-zinc-500">Top:</span>
                  <span className="ml-2 text-white font-mono">${fvg.top.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Bottom:</span>
                  <span className="ml-2 text-white font-mono">${fvg.bottom.toLocaleString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

