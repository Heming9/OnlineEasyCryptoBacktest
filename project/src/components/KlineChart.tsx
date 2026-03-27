import { useEffect, useRef } from 'react';
import { createChart, IChartApi, CandlestickData, CandlestickSeries } from 'lightweight-charts';
import type { KlineData } from '../types';

interface KlineChartProps {
  data: KlineData[];
  currentPeriodIndex: number;
  width?: number;
  height?: number;
}

export const KlineChart: React.FC<KlineChartProps> = ({
  data,
  currentPeriodIndex,
  width = 800,
  height = 400,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<any | null>(null);

  useEffect(() => {
    console.log('KlineChart 初始化:', { width, height, dataLength: data.length, currentPeriodIndex });
    
    if (!chartContainerRef.current) {
      console.error('图表容器未准备好');
      return;
    }
    
    if (!data || data.length === 0) {
      console.warn('没有数据可显示');
      return;
    }

    try {
      // Create chart
      const chart = createChart(chartContainerRef.current, {
        width,
        height,
        layout: {
          background: { color: '#1e222d' },
          textColor: '#d1d4dc',
        },
        grid: {
          vertLines: { color: '#2B2B43' },
          horzLines: { color: '#2B2B43' },
        },
        crosshair: {
          mode: 1,
        },
        localization: {
          locale: navigator.language,
          priceFormatter: (price: number) => price.toFixed(2),
        },
        timeScale: {
          borderColor: '#2B2B43',
          timeVisible: true,
          secondsVisible: false,
        },
      });

      chartRef.current = chart;

      // 设置时间格式化使用本地时区
      chart.timeScale().applyOptions({
        timeVisible: true,
        secondsVisible: false,
      });

      // Create candlestick series
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });

      candlestickSeriesRef.current = candlestickSeries;

      // 欧易 API 返回的数据是降序的（最新的在前），需要处理
      // 1. 去重 - 移除重复的时间戳
      // 2. 排序 - 按时间升序排列
      const uniqueData = data.reduce((acc, current) => {
        const exists = acc.find(item => item.time === current.time);
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, [] as KlineData[]);
      
      // 按时间升序排序
      const sortedData = uniqueData.sort((a, b) => a.time - b.time);
      
      console.log(`数据处理：原始 ${data.length} 条，去重后 ${uniqueData.length} 条`);
      
      // 只显示到当前周期的数据，如果 currentPeriodIndex < 0，只显示第一条
      const displayData = currentPeriodIndex >= 0 
        ? sortedData.slice(0, currentPeriodIndex + 1)
        : sortedData.slice(0, 1);
      
      console.log(`显示数据范围：0 到 ${displayData.length - 1}`);
      
      // 辅助函数：调整时间戳以正确显示本地时区
      // Lightweight Charts 假定时间戳是 UTC 时间，我们需要把时间戳反向调整时区偏移
      const adjustTimeToLocal = (timestamp: number): number => {
        const date = new Date(timestamp);
        // 计算本地时区偏移（分钟）
        const timezoneOffsetMinutes = date.getTimezoneOffset();
        // timezoneOffsetMinutes 是本地时间相对于 UTC 的偏移，负数表示东时区（例如中国 UTC+8 是 -480）
        // 我们需要把时间戳减去这个偏移的毫秒数，这样 Lightweight Charts 显示 UTC 时就是我们的本地时间
        return timestamp - timezoneOffsetMinutes * 60 * 1000;
      };

      // Set data
      const chartData: CandlestickData[] = displayData.map((d) => {
        const originalDate = new Date(d.time);
        const adjustedTime = adjustTimeToLocal(d.time);
        const adjustedDate = new Date(adjustedTime);
        console.log(`时间调整：原始=${originalDate.toISOString()} (本地=${originalDate.toLocaleString()}) → 调整后=${adjustedDate.toISOString()}`);
        return {
          time: (adjustedTime / 1000) as any,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        };
      });

      console.log('设置图表数据，第一条:', chartData[0], '最后一条:', chartData[chartData.length - 1]);
      console.log('数据已去重并按时间升序排序');
      
      // 验证数据顺序
      for (let i = 1; i < chartData.length; i++) {
        if (chartData[i].time <= chartData[i-1].time) {
          console.error(`数据顺序错误：index=${i}, time=${chartData[i].time}, prev time=${chartData[i-1].time}`);
        }
      }
      
      candlestickSeries.setData(chartData);

      // Fit content
      chart.timeScale().fitContent();

      console.log('图表初始化成功');
      
      // Cleanup
      return () => {
        console.log('清理图表');
        chart.remove();
      };
    } catch (error) {
      console.error('图表初始化失败:', error);
    }
  }, [width, height, currentPeriodIndex]);

  // Marker functionality removed - Lightweight Charts doesn't support markers on candlestick series

  useEffect(() => {
    if (!chartRef.current || !candlestickSeriesRef.current) return;

    // 同样需要去重和排序
    const uniqueData = data.reduce((acc, current) => {
      const exists = acc.find(item => item.time === current.time);
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, [] as KlineData[]);
    
    const sortedData = uniqueData.sort((a, b) => a.time - b.time);
    
    // 只显示到当前周期的数据
    const displayData = currentPeriodIndex >= 0 
      ? sortedData.slice(0, currentPeriodIndex + 1)
      : sortedData.slice(0, 1);

    // 辅助函数：调整时间戳以正确显示本地时区
    const adjustTimeToLocal = (timestamp: number): number => {
      const date = new Date(timestamp);
      const timezoneOffsetMinutes = date.getTimezoneOffset();
      return timestamp - timezoneOffsetMinutes * 60 * 1000;
    };

    // Update series data
    const chartData: CandlestickData[] = displayData.map((d) => ({
      time: (adjustTimeToLocal(d.time) / 1000) as any,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    console.log(`更新图表显示：${displayData.length} 条数据`);
    candlestickSeriesRef.current.setData(chartData);
    chartRef.current.timeScale().fitContent();
  }, [data, currentPeriodIndex]);

  return (
    <div
      ref={chartContainerRef}
      style={{ width, height }}
      className="rounded-lg overflow-hidden border border-gray-700"
    />
  );
};
