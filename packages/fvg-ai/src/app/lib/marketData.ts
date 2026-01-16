import { Candle, Timeframe } from '@/types/trading';

// Binance API endpoint for kline/candlestick data
const BINANCE_API = 'https://api.binance.com/api/v3/klines';

const TIMEFRAME_MAP: Record<Timeframe, string> = {
  '15m': '15m',
  '1h': '1h',
  '4h': '4h',
  '1d': '1d',
};

const CANDLE_LIMITS: Record<Timeframe, number> = {
  '15m': 200,
  '1h': 200,
  '4h': 200,
  '1d': 200,
};

export async function fetchMarketData(
  symbol: string = 'BTCUSDT',
  timeframe: Timeframe = '15m'
): Promise<Candle[]> {
  try {
    const interval = TIMEFRAME_MAP[timeframe];
    const limit = CANDLE_LIMITS[timeframe];
    
    const url = `${BINANCE_API}?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch market data: ${response.statusText}`);
    }
    
    const data = await response.json() as any[];
    
    // Transform Binance kline data to our Candle format
    const candles: Candle[] = data.map((kline: any[]) => ({
      time: kline[0], // Open time
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[5]),
    }));
    
    return candles;
  } catch (error) {
    console.error('Error fetching market data:', error);
    throw error;
  }
}

export function getWebSocketUrl(symbol: string = 'btcusdt', timeframe: Timeframe = '15m'): string {
  const interval = TIMEFRAME_MAP[timeframe];
  return `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`;
}


