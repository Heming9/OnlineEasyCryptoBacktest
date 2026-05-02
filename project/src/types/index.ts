export type TimeFrame = '1h' | '1d' | '1w' | '1M';

export interface KlineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Asset {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
}

export type VariableType = 
  | 'open'
  | 'close'
  | 'high'
  | 'low'
  | 'volume'
  | 'equity'
  | 'availableFunds'
  | 'position'
  | 'floatingPnL'
  | 'floatingPnLPercent'
  | 'positionRatio';

export type Operator = 'greater' | 'less' | 'greaterOrEqual' | 'lessOrEqual';

export type LogicOperator = 'and' | 'or';

export interface Condition {
  id: string;
  variable: VariableType;
  operator: Operator;
  value: number;
}

export interface ConditionGroup {
  id: string;
  conditions: Condition[];
  logic: LogicOperator;
}

export type TradeType = 'buy' | 'sell';

export type TradeAmountType = 'amount' | 'quantity' | 'ratio';

export interface TradeConfig {
  type: TradeType;
  amountType: TradeAmountType;
  value: number;
}

export interface Strategy {
  id: string;
  name: string;
  buyConditions: ConditionGroup[];
  sellConditions: ConditionGroup[];
  buyConfig: TradeConfig;
  sellConfig: TradeConfig;
}

export interface TradeRecord {
  id: string;
  periodIndex: number;
  time: number;
  type: TradeType;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  profit?: number;
  profitPercent?: number;
}

export interface AccountState {
  equity: number;
  realizedPnL: number;
  realizedPnLPercent: number;
  availableFunds: number;
  position: number;
  costBasis: number;
  floatingPnL: number;
  floatingPnLPercent: number;
  positionRatio: number;
}

export interface BacktestState {
  isPlaying: boolean;
  currentPeriodIndex: number;
  totalPeriods: number;
  initialCapital: number;
  strategy: Strategy | null;
  accountState: AccountState;
  tradeRecords: TradeRecord[];
  klineData: KlineData[];
  isLoadingMore: boolean;
  hasMoreData: boolean;
  dataLoadConfig: {
    symbol: string;
    timeFrame: string;
    nextStartTime: number;
    endTime: number;
    batchSize?: number;
  } | null;
}

export interface BacktestSettings {
  asset: Asset | null;
  timeFrame: TimeFrame;
  startTime: number;
  endTime: number | null;
  initialCapital: number;
}
