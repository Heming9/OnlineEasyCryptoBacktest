import type { KlineData, TimeFrame, Asset } from '../types';
import { cacheData, clearAllCache } from './database';

const OKX_API_BASE = 'https://www.okx.com/api/v5';

// 注意：公共数据接口不需要 API Key
// 如果您需要私有接口，需要添加以下请求头：
// OK-ACCESS-KEY: fd471f87-5814-4005-95b5-fe3dc16fd11b
// OK-ACCESS-SIGN: (签名)
// OK-ACCESS-TIMESTAMP: (时间戳)
// OK-ACCESS-PASSPHRASE: (您的 passphrase)

export async function fetchAssets(): Promise<Asset[]> {
  try {
    console.log('=== 获取欧易交易对列表 ===');
    // 欧易 API：获取所有交易对
    const response = await fetch(`${OKX_API_BASE}/public/instruments?instType=SPOT`);
    const data = await response.json();
    
    console.log('欧易 API 响应:', data);
    
    if (data.code !== '0') {
      console.error('欧易 API 错误:', data);
      return [];
    }
    
    // Filter USDT pairs only
    const assets = data.data
      .filter((item: any) => 
        item.quoteCcy === 'USDT' && 
        item.instId.includes('-USDT') &&
        item.state === 'live'
      )
      .map((item: any) => ({
        symbol: item.instId, // OKX 格式：BTC-USDT
        baseAsset: item.baseCcy,
        quoteAsset: item.quoteCcy,
      }))
      .slice(0, 100); // Limit to 100 for performance
    
    console.log('获取到的交易对数量:', assets.length);
    return assets;
  } catch (error) {
    console.error('Error fetching assets:', error);
    return [];
  }
}

export function getTimeFrameInterval(timeFrame: TimeFrame): string {
  // 欧易的 K 线周期格式
  const mapping: Record<TimeFrame, string> = {
    '1h': '1H',    // 欧易用 1H 表示小时
    '1d': '1D',    // 欧易用 1D 表示天
    '1w': '1W',    // 欧易用 1W 表示周
    '1M': '1M',    // 月
  };
  return mapping[timeFrame];
}

/**
 * 计算周期的毫秒数
 */
function getPeriodMilliseconds(timeFrame: TimeFrame): number {
  switch (timeFrame) {
    case '1h':
      return 60 * 60 * 1000; // 1 小时
    case '1d':
      return 24 * 60 * 60 * 1000; // 1 天
    case '1w':
      return 7 * 24 * 60 * 60 * 1000; // 1 周
    case '1M':
      return 30 * 24 * 60 * 60 * 1000; // 1 月（按 30 天计算）
    default:
      return 24 * 60 * 60 * 1000;
  }
}

export async function fetchKlineData(
  symbol: string,
  timeFrame: TimeFrame,
  startTime: number,
  endTime: number
): Promise<KlineData[]> {
  const logMsg = {
    symbol,
    timeFrame,
    startTime,
    startTimeStr: new Date(startTime).toISOString(),
    endTimeStr: new Date(endTime).toISOString(),
  };
  
  console.log('=== 欧易 API 请求 ===');
  console.log(logMsg);
  
  // 在浏览器中显示请求信息
  if (typeof window !== 'undefined') {
    console.log('准备请求 OKX API，参数:', JSON.stringify(logMsg, null, 2));
  }

  // 清除旧缓存，避免数据问题
  await clearAllCache();

  const interval = getTimeFrameInterval(timeFrame);
  const allData: KlineData[] = [];
  let currentStartTime = startTime;
  
  // 获取当前时间戳
  const currentTime = Date.now();

  try {
    let requestCount = 0;
    // OKX API 每次最多返回 100 条数据
    const limit = 100;
    
    while (currentStartTime < endTime && currentStartTime < currentTime) {
      // 欧易 K 线 API：bar 参数是时间粒度
      // before: 起始时间戳（毫秒），after: 结束时间戳（毫秒）
      // 使用 limit=100 一次性获取最多 100 条数据
      const url = `${OKX_API_BASE}/market/candles?instId=${symbol}&bar=${interval}&before=${currentStartTime}&after=${endTime}&limit=${limit}`;
      console.log(`🌐 请求 #${++requestCount}:`, url);
      console.log(`   时间范围：${new Date(currentStartTime).toISOString()} 到 ${new Date(endTime).toISOString()}`);
      
      const response = await fetch(url);
      console.log(`📡 响应状态：${response.status} ${response.ok ? '✅' : '❌'}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP 错误:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
      
      const result = await response.json();
      console.log(`📊 欧易 API 响应:`, result);
      
      if (result.code !== '0') {
        console.error('❌ 欧易 API 业务错误:', result);
        throw new Error(`OKX API Error: ${result.msg || result.code}`);
      }
      
      const data = result.data;
      console.log(`📊 收到数据条数：${data.length}`);
      
      if (data.length > 0) {
        // 欧易 K 线数据格式：[时间戳，开盘价，最高价，最低价，收盘价，成交量，...]
        console.log('第一条数据时间:', new Date(parseInt(data[0][0])).toISOString());
        console.log('最后一条数据时间:', new Date(parseInt(data[data.length - 1][0])).toISOString());
      }

      if (data.length === 0) {
        console.log('⚠️ 数据为空，停止请求');
        break;
      }

      const klineData: KlineData[] = data.map((kline: string[]) => ({
        time: parseInt(kline[0]), // [0] 时间戳
        open: parseFloat(kline[1]), // [1] 开盘价
        high: parseFloat(kline[2]), // [2] 最高价
        low: parseFloat(kline[3]), // [3] 最低价
        close: parseFloat(kline[4]), // [4] 收盘价
        volume: parseFloat(kline[5]), // [5] 交易量
      }));

      allData.push(...klineData);
      console.log(`✅ 累计数据：${allData.length} 条`);

      // Update start time for next iteration
      // 欧易数据按时间正序排列，取最后一条数据的时间
      const lastTime = parseInt(data[data.length - 1][0]);
      currentStartTime = lastTime + 1;
      
      // 如果返回的数据少于 limit，说明已经获取完所有数据
      if (data.length < limit) {
        console.log('✅ 返回数据少于限制，已获取完所有数据');
        break;
      }
      
      // 如果当前时间已经超过或等于结束时间，停止请求
      if (currentStartTime >= endTime || currentStartTime >= currentTime) {
        console.log('✅ 已达到结束时间或当前时间，停止请求');
        break;
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(`\n🎉 总共获取数据：${allData.length} 条`);

    // Cache the data
    if (allData.length > 0) {
      console.log('💾 缓存数据到 IndexedDB...');
      await cacheData(symbol, timeFrame, startTime, endTime, allData);
    } else {
      console.warn('⚠️ 未获取到任何数据');
      console.warn('请检查：');
      console.warn(`  - 交易对是否正确：${symbol}`);
      console.warn(`  - 时间范围是否有效：${new Date(startTime).toISOString()} 到 ${new Date(endTime).toISOString()}`);
      console.warn(`  - 该时间段是否有交易数据`);
    }

    return allData;
  } catch (error) {
    console.error('❌ 获取 K 线数据失败:', error);
    if (typeof window !== 'undefined') {
      alert(`获取数据失败：${error instanceof Error ? error.message : String(error)}\n\n请检查：\n1. 网络连接\n2. 选择的交易对和时间范围\n3. 浏览器控制台查看详细错误`);
    }
    return [];
  }
}

export async function fetchSymbolKlines(
  symbol: string,
  interval: string,
  limit: number = 100
): Promise<KlineData[]> {
  try {
    // 欧易 API 最多返回 300 条
    const url = `${OKX_API_BASE}/market/candles?instId=${symbol}&bar=${interval}&limit=${limit}`;
    const response = await fetch(url);
    const result = await response.json();

    if (result.code !== '0') {
      console.error('OKX API Error:', result);
      return [];
    }

    const data = result.data;
    return data.map((kline: string[]) => ({
      time: parseInt(kline[0]),
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[5]),
    }));
  } catch (error) {
    console.error('Error fetching klines:', error);
    return [];
  }
}
