import { Candle, FVG, MarketBias } from '@/types/trading';

/**
 * Calculate market bias from higher timeframe candles
 * Uses simple moving average and price action
 */
export function calculateMarketBias(candles: Candle[]): MarketBias {
  if (candles.length < 20) return 'neutral';
  
  // Get last 20 candles for bias calculation
  const recentCandles = candles.slice(-20);
  
  // Calculate simple moving average
  const sma = recentCandles.reduce((sum, c) => sum + c.close, 0) / recentCandles.length;
  
  const currentPrice = candles[candles.length - 1].close;
  const priceVsSma = ((currentPrice - sma) / sma) * 100;
  
  // Count bullish vs bearish candles
  const bullishCount = recentCandles.filter(c => c.close > c.open).length;
  const bearishCount = recentCandles.length - bullishCount;
  
  // Determine bias
  if (priceVsSma > 1 && bullishCount > bearishCount * 1.2) {
    return 'bullish';
  } else if (priceVsSma < -1 && bearishCount > bullishCount * 1.2) {
    return 'bearish';
  }
  
  return 'neutral';
}

/**
 * Detect Fair Value Gaps (FVGs) in candle data
 * A bullish FVG occurs when candle[i-1].low > candle[i+1].high
 * A bearish FVG occurs when candle[i-1].high < candle[i+1].low
 */
export function detectFVGs(candles: Candle[], marketBias: MarketBias): FVG[] {
  const fvgs: FVG[] = [];
  
  // Need at least 3 candles to detect an FVG
  if (candles.length < 3) return fvgs;
  
  for (let i = 1; i < candles.length - 1; i++) {
    const prev = candles[i - 1];
    const next = candles[i + 1];
    
    // Bullish FVG: gap between prev low and next high
    if (prev.low > next.high) {
      const alignedWithBias = marketBias === 'bullish';
      
      // Only add if aligned with bias or bias is neutral
      if (alignedWithBias || marketBias === 'neutral') {
        fvgs.push({
          id: `fvg-bull-${i}-${Date.now()}`,
          type: 'bullish',
          top: prev.low,
          bottom: next.high,
          startTime: next.time,
          endTime: candles[candles.length - 1].time,
          filled: false,
          alignedWithBias,
        });
      }
    }
    
    // Bearish FVG: gap between prev high and next low
    if (prev.high < next.low) {
      const alignedWithBias = marketBias === 'bearish';
      
      // Only add if aligned with bias or bias is neutral
      if (alignedWithBias || marketBias === 'neutral') {
        fvgs.push({
          id: `fvg-bear-${i}-${Date.now()}`,
          type: 'bearish',
          top: next.low,
          bottom: prev.high,
          startTime: next.time,
          endTime: candles[candles.length - 1].time,
          filled: false,
          alignedWithBias,
        });
      }
    }
  }
  
  return fvgs;
}

/**
 * Check if price has entered an FVG zone
 */
export function checkFVGEntry(candle: Candle, fvg: FVG): boolean {
  const { high, low } = candle;
  const { top, bottom } = fvg;
  
  // Check if candle overlaps with FVG zone
  return (low <= top && high >= bottom);
}

/**
 * Update FVG filled status based on current price action
 */
export function updateFVGStatus(fvgs: FVG[], candles: Candle[]): FVG[] {
  if (candles.length === 0) return fvgs;
  
  return fvgs.map(fvg => {
    // Check if any recent candle has filled the gap
    const recentCandles = candles.slice(-10);
    
    for (const candle of recentCandles) {
      if (fvg.type === 'bullish') {
        // Bullish FVG is filled when price goes below the bottom
        if (candle.low < fvg.bottom) {
          return { ...fvg, filled: true };
        }
      } else {
        // Bearish FVG is filled when price goes above the top
        if (candle.high > fvg.top) {
          return { ...fvg, filled: true };
        }
      }
    }
    
    return fvg;
  });
}

