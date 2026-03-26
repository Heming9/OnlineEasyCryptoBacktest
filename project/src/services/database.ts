import Dexie, { type Table } from 'dexie';
import type { KlineData } from '../types';

interface CachedData {
  id?: number;
  symbol: string;
  timeFrame: string;
  startTime: number;
  endTime: number;
  data: KlineData[];
  cachedAt: number;
}

class BacktestDatabase extends Dexie {
  cachedData!: Table<CachedData, number>;

  constructor() {
    super('BacktestDB');
    
    this.version(1).stores({
      cachedData: '++id, symbol, timeFrame, startTime, endTime',
    });
  }
}

export const db = new BacktestDatabase();

export async function getCachedData(
  symbol: string,
  timeFrame: string,
  startTime: number,
  endTime: number
): Promise<KlineData[] | null> {
  const cached = await db.cachedData.where({
    symbol,
    timeFrame,
  }).first();

  if (!cached) return null;

  // Check if cached data covers the requested time range
  if (cached.startTime <= startTime && cached.endTime >= endTime) {
    // Filter data to requested range
    return cached.data.filter(
      (item) => item.time >= startTime && item.time <= endTime
    );
  }

  return null;
}

export async function cacheData(
  symbol: string,
  timeFrame: string,
  startTime: number,
  endTime: number,
  data: KlineData[]
): Promise<void> {
  await db.cachedData.add({
    symbol,
    timeFrame,
    startTime,
    endTime,
    data,
    cachedAt: Date.now(),
  });
}

export async function clearOldCache(maxAgeDays: number = 7): Promise<void> {
  const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;
  const now = Date.now();

  await db.cachedData
    .filter((item) => now - item.cachedAt > maxAge)
    .delete();
}

export async function clearAllCache(): Promise<void> {
  await db.cachedData.clear();
  console.log('✅ 已清除所有缓存数据');
}
