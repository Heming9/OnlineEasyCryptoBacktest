import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { BacktestState, BacktestSettings, Strategy, AccountState, KlineData } from '../types';

const STRATEGY_STORAGE_KEY = 'backtest_strategy';

// 从 localStorage 加载策略
const loadSavedStrategy = (): Strategy | null => {
  try {
    const saved = localStorage.getItem(STRATEGY_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('加载保存的策略失败:', error);
  }
  return null;
};

// 保存策略到 localStorage
const saveStrategyToStorage = (strategy: Strategy | null) => {
  try {
    if (strategy) {
      localStorage.setItem(STRATEGY_STORAGE_KEY, JSON.stringify(strategy));
    } else {
      localStorage.removeItem(STRATEGY_STORAGE_KEY);
    }
  } catch (error) {
    console.error('保存策略失败:', error);
  }
};

// 辅助函数：获取周期毫秒数
const getPeriodMilliseconds = (timeFrame: string): number => {
  switch (timeFrame) {
    case '1h':
      return 60 * 60 * 1000;
    case '1d':
      return 24 * 60 * 60 * 1000;
    case '1w':
      return 7 * 24 * 60 * 60 * 1000;
    default:
      return 24 * 60 * 60 * 1000;
  }
};

interface BacktestStore {
  settings: BacktestSettings;
  backtestState: BacktestState;
  
  // Settings actions
  updateSettings: (settings: Partial<BacktestSettings>) => void;
  
  // Backtest control actions
  setKlineData: (data: KlineData[]) => void;
  appendKlineData: (data: KlineData[]) => void;
  setStrategy: (strategy: Strategy | null) => void;
  setInitialCapital: (capital: number) => void;
  
  // Playback control
  play: () => void;
  pause: () => void;
  replay: () => void;
  nextPeriod: () => void;
  previousPeriod: () => void;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
  
  // Internal actions
  executePeriod: (periodIndex: number) => void;
  rollbackAccount: (periodIndex: number) => void;
  
  // Dynamic loading
  loadMoreData: () => Promise<boolean>;
  }

const initialAccountState: AccountState = {
  equity: 0,
  realizedPnL: 0,
  realizedPnLPercent: 0,
  availableFunds: 0,
  position: 0,
  costBasis: 0,
  floatingPnL: 0,
  floatingPnLPercent: 0,
  positionRatio: 0,
};

const initialBacktestState: BacktestState = {
  isPlaying: false,
  currentPeriodIndex: 0,
  totalPeriods: 0,
  initialCapital: 10000,
  strategy: loadSavedStrategy(), // 加载保存的策略
  accountState: { ...initialAccountState },
  tradeRecords: [],
  klineData: [],
  isLoadingMore: false,
  hasMoreData: true,
  dataLoadConfig: null,
};

export const useBacktestStore = create<BacktestStore>()(
  immer((set, get) => ({
    settings: {
      asset: null,
      timeFrame: '1d',
      startTime: 0,
      initialCapital: 10000,
    },
    backtestState: { ...initialBacktestState },
    
    updateSettings: (settings) => {
      set((state) => {
        state.settings = { ...state.settings, ...settings };
      });
    },
    
    setKlineData: (data, loadConfig?: { symbol: string; timeFrame: string; nextStartTime: number; endTime: number } | null) => {
      // 去重和排序
      const uniqueData = data.reduce((acc, current) => {
        const exists = acc.find(item => item.time === current.time);
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, [] as any[]);
      
      const sortedData = uniqueData.sort((a, b) => a.time - b.time);
      
      set((state) => {
        const initialCapital = state.settings.initialCapital;
        state.backtestState.klineData = sortedData;
        state.backtestState.totalPeriods = sortedData.length;
        state.backtestState.currentPeriodIndex = 0;
        state.backtestState.accountState = { 
          ...initialAccountState,
          equity: initialCapital,
          availableFunds: initialCapital,
        };
        state.backtestState.tradeRecords = [];
        state.backtestState.dataLoadConfig = loadConfig || null;
        state.backtestState.hasMoreData = sortedData.length >= 10;
      });
    },
    
    appendKlineData: (data) => {
      set((state) => {
        // 合并新旧数据
        const combinedData = [...state.backtestState.klineData, ...data];
        
        // 去重和排序
        const uniqueData = combinedData.reduce((acc, current) => {
          const exists = acc.find(item => item.time === current.time);
          if (!exists) {
            acc.push(current);
          }
          return acc;
        }, [] as KlineData[]);
        
        const sortedData = uniqueData.sort((a, b) => a.time - b.time);
        
        state.backtestState.klineData = sortedData;
        state.backtestState.totalPeriods = sortedData.length;
      });
    },
    
    loadMoreData: async () => {
      const state = get();
      const config = state.backtestState.dataLoadConfig;
      
      if (!config || state.backtestState.isLoadingMore) {
        return false;
      }
      
      set((s) => {
        s.backtestState.isLoadingMore = true;
      });
      
      try {
        // 动态导入 fetchKlineData 避免循环依赖
        const { fetchKlineData } = await import('../services/okx');
        
        // 从已有数据的最后一个周期计算下一次的起始时间
        const currentData = state.backtestState.klineData;
        const lastDataTime = currentData.length > 0 
          ? currentData[currentData.length - 1].time 
          : (config as any).nextStartTime;
        const nextStartTime = lastDataTime + 1;
        
        // 计算本次加载的结束时间（再加载100个周期）
        const batchSize = config.batchSize || 100;
        const periodMs = getPeriodMilliseconds(config.timeFrame as any);
        const requestEndTime = Math.min(
          nextStartTime + batchSize * periodMs,
          config.endTime,
          Date.now()
        );
        
        console.log(`[loadMoreData] 加载更多数据: ${nextStartTime} 到 ${requestEndTime}, 批次大小: ${batchSize}`);
        console.log(`[loadMoreData] 已有数据: ${currentData.length} 条，最后一条时间: ${lastDataTime}`);
        
        const newData = await fetchKlineData(
          config.symbol,
          config.timeFrame as any,
          nextStartTime,
          requestEndTime
        );
        
        if (newData.length === 0) {
          console.log('[loadMoreData] 无新数据');
          set((s) => {
            s.backtestState.hasMoreData = false;
            s.backtestState.isLoadingMore = false;
          });
          return false;
        }
        
        console.log(`[loadMoreData] 收到 ${newData.length} 条新数据`);
        
        // 更新数据加载配置
        const lastTime = newData[newData.length - 1].time;
        const currentTime = Date.now();
        
        set((s) => {
          // 追加数据
          const combinedData = [...s.backtestState.klineData, ...newData];
          const uniqueData = combinedData.reduce((acc, current) => {
            const exists = acc.find(item => item.time === current.time);
            if (!exists) {
              acc.push(current);
            }
            return acc;
          }, [] as KlineData[]);
          
          const sortedData = uniqueData.sort((a, b) => a.time - b.time);
          
          console.log(`[loadMoreData] 合并后: ${sortedData.length} 条数据`);
          
          s.backtestState.klineData = sortedData;
          s.backtestState.totalPeriods = sortedData.length;
          
          // 更新配置
          if (s.backtestState.dataLoadConfig) {
            s.backtestState.dataLoadConfig.nextStartTime = lastTime + 1;
          }
          
          // 检查是否还有更多数据
          s.backtestState.hasMoreData = newData.length >= batchSize && lastTime < config.endTime && lastTime < currentTime;
          s.backtestState.isLoadingMore = false;
          
          console.log(`[loadMoreData] 更新完成: totalPeriods=${sortedData.length}, hasMoreData=${s.backtestState.hasMoreData}`);
        });
        
        return true;
      } catch (error) {
        console.error('[loadMoreData] 加载失败:', error);
        set((s) => {
          s.backtestState.isLoadingMore = false;
        });
        return false;
      }
    },
    
    // 播放速度（毫秒）
    playbackSpeed: 1000,
    setPlaybackSpeed: (speed) => {
      set((state) => {
        state.playbackSpeed = speed;
      });
    },
    
    setStrategy: (strategy) => {
      set((state) => {
        state.backtestState.strategy = strategy;
      });
      // 保存到 localStorage
      saveStrategyToStorage(strategy);
    },
    
    setInitialCapital: (capital) => {
      set((state) => {
        state.settings.initialCapital = capital;
        state.backtestState.initialCapital = capital;
      });
    },
    
    play: () => {
      set((state) => {
        state.backtestState.isPlaying = true;
      });
    },
    
    pause: () => {
      set((state) => {
        state.backtestState.isPlaying = false;
      });
    },
    
    replay: () => {
      set((state) => {
        const initialCapital = state.backtestState.initialCapital;
        state.backtestState.isPlaying = false;
        state.backtestState.currentPeriodIndex = 0;
        state.backtestState.accountState = { 
          ...initialAccountState,
          equity: initialCapital,
          availableFunds: initialCapital,
        };
        state.backtestState.tradeRecords = [];
      });
    },
    
    nextPeriod: async () => {
      const state = get();
      const currentIndex = state.backtestState.currentPeriodIndex;
      const totalPeriods = state.backtestState.totalPeriods;
      const hasMoreData = state.backtestState.hasMoreData;
      const isLoadingMore = state.backtestState.isLoadingMore;
      
      // 当进度使用到一半时，加载更多数据
      const progressRatio = totalPeriods > 0 ? (currentIndex + 1) / totalPeriods : 0;
      console.log(`[nextPeriod] 当前索引：${currentIndex}, 总周期：${totalPeriods}, 进度：${(progressRatio * 100).toFixed(0)}%, hasMoreData: ${hasMoreData}, isLoadingMore: ${isLoadingMore}`);
      
      if (progressRatio >= 0.5 && hasMoreData && !isLoadingMore) {
        console.log(`🚀 触发加载：进度已使用${(progressRatio * 100).toFixed(0)}%`);
        console.log('当前 dataLoadConfig:', state.backtestState.dataLoadConfig);
        const loaded = await state.loadMoreData();
        if (loaded) {
          const newState = get();
          console.log('✅ 新数据已加载，当前总周期数:', newState.backtestState.totalPeriods);
        } else {
          console.log('❌ 数据加载失败或无更多数据');
        }
      }
      
      // 执行下一个周期（使用最新的 totalPeriods）
      const updatedTotalPeriods = get().backtestState.totalPeriods;
      if (currentIndex < updatedTotalPeriods - 1) {
        const nextIndex = currentIndex + 1;
        get().executePeriod(nextIndex);
      } else {
        console.log(`[nextPeriod] 已达末尾：${currentIndex} >= ${updatedTotalPeriods - 1}`);
      }
    },
    
    previousPeriod: () => {
      const { backtestState } = get();
      if (backtestState.currentPeriodIndex > 0) {
        get().rollbackAccount(backtestState.currentPeriodIndex);
        set((state) => {
          state.backtestState.currentPeriodIndex--;
        });
      }
    },
    
    executePeriod: (periodIndex) => {
      const { backtestState } = get();
      const kline = backtestState.klineData[periodIndex];
      if (!kline) return;
      
      let accountState = { ...backtestState.accountState };
      const tradeRecords = [...backtestState.tradeRecords];
      
      // Update floating PnL for existing position
      if (accountState.position > 0) {
        const marketValue = accountState.position * kline.close;
        accountState.floatingPnL = marketValue - accountState.costBasis;
        accountState.floatingPnLPercent = accountState.costBasis > 0 
          ? (accountState.floatingPnL / accountState.costBasis) * 100 
          : 0;
        // 权益 = 可用资金 + 持仓市值（市值已经包含成本和盈亏）
        accountState.equity = accountState.availableFunds + marketValue;
        accountState.positionRatio = accountState.equity > 0 ? marketValue / accountState.equity : 0;
      }
      
      // Execute strategy if exists
      const strategy = backtestState.strategy;
      if (strategy) {
        // First execute sell conditions
        const shouldSell = checkConditions(strategy.sellConditions, kline, accountState);
        if (shouldSell && accountState.position > 0) {
          const sellConfig = strategy.sellConfig;
          let sellQuantity = 0;
          
          if (sellConfig.amountType === 'quantity') {
            sellQuantity = Math.min(sellConfig.value, accountState.position);
          } else if (sellConfig.amountType === 'ratio') {
            sellQuantity = accountState.position * (sellConfig.value / 100);
          } else if (sellConfig.amountType === 'amount') {
            sellQuantity = sellConfig.value / kline.close;
          }
          
          if (sellQuantity > 0) {
            const sellValue = sellQuantity * kline.close;
            const avgCost = accountState.costBasis / accountState.position;
            const costOfSold = avgCost * sellQuantity;
            const profit = sellValue - costOfSold;
            const profitPercent = costOfSold > 0 ? (profit / costOfSold) * 100 : 0;
            
            // 先计算成本，再更新持仓
            accountState.costBasis -= costOfSold;
            accountState.position -= sellQuantity;
            accountState.availableFunds += sellValue;
            accountState.realizedPnL += profit;
            accountState.realizedPnLPercent = accountState.realizedPnL / backtestState.initialCapital * 100;
            
            if (accountState.position === 0) {
              accountState.costBasis = 0;
              accountState.floatingPnL = 0;
              accountState.floatingPnLPercent = 0;
            }
            
            // 重新计算当前权益和浮盈亏
            const marketValue = accountState.position * kline.close;
            accountState.floatingPnL = marketValue - accountState.costBasis;
            accountState.floatingPnLPercent = accountState.costBasis > 0
              ? (accountState.floatingPnL / accountState.costBasis) * 100
              : 0;
            accountState.equity = accountState.availableFunds + marketValue;
            accountState.positionRatio = accountState.equity > 0 ? marketValue / accountState.equity : 0;
            
            tradeRecords.push({
              id: `trade-${periodIndex}-sell`,
              periodIndex,
              time: kline.time,
              type: 'sell',
              entryPrice: kline.close,
              quantity: sellQuantity,
              profit,
              profitPercent,
            });
          }
        }
        
        // Then execute buy conditions
        const shouldBuy = checkConditions(strategy.buyConditions, kline, accountState);
        if (shouldBuy && accountState.availableFunds > 0) {
          const buyConfig = strategy.buyConfig;
          let buyQuantity = 0;
          
          if (buyConfig.amountType === 'quantity') {
            buyQuantity = buyConfig.value;
          } else if (buyConfig.amountType === 'ratio') {
            const maxAffordable = accountState.availableFunds / kline.close;
            buyQuantity = maxAffordable * (buyConfig.value / 100);
          } else if (buyConfig.amountType === 'amount') {
            const amount = Math.min(buyConfig.value, accountState.availableFunds);
            buyQuantity = amount / kline.close;
          }
          
          if (buyQuantity > 0) {
            const buyValue = buyQuantity * kline.close;
            if (buyValue <= accountState.availableFunds) {
              accountState.position += buyQuantity;
              accountState.availableFunds -= buyValue;
              accountState.costBasis += buyValue;
              
              // 重新计算浮盈亏
              const marketValue = accountState.position * kline.close;
              accountState.floatingPnL = marketValue - accountState.costBasis;
              accountState.floatingPnLPercent = accountState.costBasis > 0
                ? (accountState.floatingPnL / accountState.costBasis) * 100
                : 0;
              accountState.equity = accountState.availableFunds + marketValue;
              accountState.positionRatio = marketValue / accountState.equity;
              
              tradeRecords.push({
                id: `trade-${periodIndex}-buy`,
                periodIndex,
                time: kline.time,
                type: 'buy',
                entryPrice: kline.close,
                quantity: buyQuantity,
              });
            }
          }
        }
      }
      
      // 确保每个周期都更新浮盈亏（即使没有交易）
      if (accountState.position > 0) {
        const marketValue = accountState.position * kline.close;
        accountState.floatingPnL = marketValue - accountState.costBasis;
        accountState.floatingPnLPercent = accountState.costBasis > 0
          ? (accountState.floatingPnL / accountState.costBasis) * 100
          : 0;
        accountState.equity = accountState.availableFunds + marketValue;
        accountState.positionRatio = marketValue / accountState.equity;
      }
      
      set((state) => {
        state.backtestState.currentPeriodIndex = periodIndex;
        state.backtestState.accountState = accountState;
        state.backtestState.tradeRecords = tradeRecords;
      });
    },
    
    rollbackAccount: (periodIndex) => {
      const { backtestState } = get();
      
      // Recalculate account state from beginning to periodIndex - 1
      let accountState: AccountState = { ...initialAccountState };
      accountState.availableFunds = backtestState.initialCapital;
      accountState.equity = backtestState.initialCapital;
      
      const tradeRecords = backtestState.tradeRecords.filter(
        (record) => record.periodIndex < periodIndex - 1
      );
      
      // Replay all trades up to periodIndex - 1
      for (let i = 0; i < periodIndex - 1; i++) {
        const kline = backtestState.klineData[i];
        if (!kline) continue;
        
        // Update floating PnL
        if (accountState.position > 0) {
          const marketValue = accountState.position * kline.close;
          accountState.floatingPnL = marketValue - accountState.costBasis;
          accountState.floatingPnLPercent = accountState.costBasis > 0 
            ? (accountState.floatingPnL / accountState.costBasis) * 100 
            : 0;
          accountState.equity = accountState.availableFunds + marketValue;
          accountState.positionRatio = marketValue / accountState.equity;
        }
        
        // Find trades at this period
        const tradesAtPeriod = tradeRecords.filter((r) => r.periodIndex === i);
        for (const trade of tradesAtPeriod) {
          if (trade.type === 'buy') {
            accountState.position += trade.quantity;
            accountState.availableFunds -= trade.quantity * trade.entryPrice;
            accountState.costBasis += trade.quantity * trade.entryPrice;
          } else if (trade.type === 'sell' && trade.profit !== undefined) {
            accountState.position -= trade.quantity;
            accountState.availableFunds += trade.quantity * trade.entryPrice;
            accountState.realizedPnL += trade.profit;
            accountState.realizedPnLPercent = accountState.realizedPnL / backtestState.initialCapital * 100;
            if (accountState.position === 0) {
              accountState.costBasis = 0;
            }
          }
        }
      }
      
      set((state) => {
        state.backtestState.accountState = accountState;
        state.backtestState.tradeRecords = tradeRecords;
      });
    },
  }))
);

function checkConditions(
  conditionGroups: any[],
  kline: KlineData,
  accountState: AccountState
): boolean {
  if (conditionGroups.length === 0) return false;
  
  for (const group of conditionGroups) {
    const groupResult = group.conditions.every((condition: any) => {
      let variableValue = 0;
      
      switch (condition.variable) {
        case 'open':
          variableValue = kline.open;
          break;
        case 'close':
          variableValue = kline.close;
          break;
        case 'high':
          variableValue = kline.high;
          break;
        case 'low':
          variableValue = kline.low;
          break;
        case 'volume':
          variableValue = kline.volume;
          break;
        case 'equity':
          variableValue = accountState.equity;
          break;
        case 'availableFunds':
          variableValue = accountState.availableFunds;
          break;
        case 'position':
          variableValue = accountState.position;
          break;
        case 'floatingPnL':
          variableValue = accountState.floatingPnL;
          break;
        case 'floatingPnLPercent':
          variableValue = accountState.floatingPnLPercent;
          break;
        case 'positionRatio':
          variableValue = accountState.positionRatio * 100;
          break;
      }
      
      if (condition.operator === 'greater') {
        return variableValue > condition.value;
      } else if (condition.operator === 'less') {
        return variableValue < condition.value;
      } else if (condition.operator === 'greaterOrEqual') {
        return variableValue >= condition.value;
      } else if (condition.operator === 'lessOrEqual') {
        return variableValue <= condition.value;
      }
      return false;
    });
    
    if (groupResult) return true;
  }
  
  return false;
}
