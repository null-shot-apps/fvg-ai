export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface FVG {
  id: string;
  type: 'bullish' | 'bearish';
  top: number;
  bottom: number;
  startTime: number;
  endTime: number;
  filled: boolean;
  alignedWithBias: boolean;
}

export type Timeframe = '15m' | '1h' | '4h' | '1d';

export type MarketBias = 'bullish' | 'bearish' | 'neutral';

export interface TimeframeData {
  candles: Candle[];
  fvgs: FVG[];
  bias: MarketBias;
}

