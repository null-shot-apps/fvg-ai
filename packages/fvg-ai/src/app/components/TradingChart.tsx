// @ts-nocheck
'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts';
import { Candle, FVG, Timeframe } from '@/types/trading';

interface TradingChartProps {
  candles: Candle[];
  fvgs: FVG[];
  timeframe: Timeframe;
  symbol: string;
}

export default function TradingChart({ candles, fvgs, timeframe, symbol }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#0a0a0a' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#1f1f1f' },
        horzLines: { color: '#1f1f1f' },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: '#2a2a2a',
      },
      rightPriceScale: {
        borderColor: '#2a2a2a',
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#6b7280',
          width: 1,
          style: 3,
        },
        horzLine: {
          color: '#6b7280',
          width: 1,
          style: 3,
        },
      },
    });

    chartRef.current = chart;

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    candlestickSeriesRef.current = candlestickSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Update candle data
  useEffect(() => {
    if (!candlestickSeriesRef.current || candles.length === 0) return;

    const chartData: CandlestickData[] = candles.map(candle => ({
      time: (candle.time / 1000) as Time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));

    candlestickSeriesRef.current.setData(chartData);
  }, [candles]);

  // Draw FVG zones
  useEffect(() => {
    if (!chartRef.current || fvgs.length === 0) return;

    // Remove old markers/shapes (lightweight-charts doesn't have built-in rectangle support)
    // We'll use price lines to show FVG zones
    
    fvgs.forEach(fvg => {
      if (!candlestickSeriesRef.current || fvg.filled) return;

      const color = fvg.type === 'bullish' 
        ? (fvg.alignedWithBias ? 'rgba(16, 185, 129, 0.15)' : 'rgba(107, 114, 128, 0.1)')
        : (fvg.alignedWithBias ? 'rgba(239, 68, 68, 0.15)' : 'rgba(107, 114, 128, 0.1)');

      const lineColor = fvg.type === 'bullish'
        ? (fvg.alignedWithBias ? '#10b981' : '#6b7280')
        : (fvg.alignedWithBias ? '#ef4444' : '#6b7280');

      // Draw top line
      candlestickSeriesRef.current.createPriceLine({
        price: fvg.top,
        color: lineColor,
        lineWidth: 1,
        lineStyle: 2, // Dashed
        axisLabelVisible: false,
        title: '',
      });

      // Draw bottom line
      candlestickSeriesRef.current.createPriceLine({
        price: fvg.bottom,
        color: lineColor,
        lineWidth: 1,
        lineStyle: 2, // Dashed
        axisLabelVisible: false,
        title: '',
      });
    });
  }, [fvgs]);

  return (
    <div 
      ref={chartContainerRef} 
      className="w-full h-full"
      style={{ minHeight: '400px' }}
    />
  );
}

