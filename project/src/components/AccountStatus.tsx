import React from 'react';
import { useTranslation } from 'react-i18next';
import { useBacktestStore } from '../store/backtestStore';

import dayjs from 'dayjs';

interface AccountStatusProps {
  showTrades?: boolean;
}

const OPERATOR_LABELS: Record<string, string> = {
  greater: '>',
  less: '<',
  greaterOrEqual: '≥',
  lessOrEqual: '≤',
};

const VARIABLE_LABELS: Record<string, string> = {
  open: '开盘价',
  close: '收盘价',
  high: '最高价',
  low: '最低价',
  volume: '成交量',
  equity: '当前权益',
  availableFunds: '可用资金',
  position: '持仓数量',
  floatingPnL: '浮盈亏',
  floatingPnLPercent: '浮盈亏率',
  positionRatio: '持仓占比',
};

export const AccountStatus: React.FC<AccountStatusProps> = ({
  showTrades = true,
}) => {
  const { t } = useTranslation();
  const { backtestState, settings } = useBacktestStore();
  const { accountState, tradeRecords, strategy, currentPeriodIndex, klineData } = backtestState;

  // 计算已执行时间
  const getElapsedTime = (): string => {
    if (klineData.length === 0 || currentPeriodIndex === 0) {
      return `0 ${t('accountStatus.hours')}`;
    }
    
    const timeFrame = settings.timeFrame;
    let hours = 0;
    
    switch (timeFrame) {
      case '1h':
        hours = currentPeriodIndex;
        break;
      case '1d':
        hours = currentPeriodIndex * 24;
        break;
      case '1w':
        hours = currentPeriodIndex * 24 * 7;
        break;
      default:
        hours = currentPeriodIndex * 24;
    }
    
    if (hours < 24) {
      return `${hours} ${t('accountStatus.hours')}`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return remainingHours > 0 
        ? `${days} ${t('accountStatus.days')} ${remainingHours} ${t('accountStatus.hours')}` 
        : `${days} ${t('accountStatus.days')}`;
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
      <h2 className="text-lg font-semibold text-white">{t('accountStatus.title')}</h2>

      {/* Core Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-gray-700/50 rounded p-3">
          <p className="text-xs text-gray-400 mb-1">{t('accountStatus.elapsedTime')}</p>
          <p className="text-lg font-semibold text-white">
            {getElapsedTime()}
          </p>
        </div>
        <div className="bg-gray-700/50 rounded p-3">
          <p className="text-xs text-gray-400 mb-1">{t('accountStatus.currentEquity')}</p>
          <p className="text-lg font-semibold text-white">
            ${accountState.equity.toFixed(2)}
          </p>
        </div>

        <div className="bg-gray-700/50 rounded p-3">
          <p className="text-xs text-gray-400 mb-1">{t('accountStatus.availableFunds')}</p>
          <p className="text-lg font-semibold text-white">
            ${accountState.availableFunds.toFixed(2)}
          </p>
        </div>

        <div className="bg-gray-700/50 rounded p-3">
          <p className="text-xs text-gray-400 mb-1">{t('accountStatus.position')}</p>
          <p className="text-lg font-semibold text-white">
            {accountState.position.toFixed(6)}
          </p>
        </div>

        <div className="bg-gray-700/50 rounded p-3">
          <p className="text-xs text-gray-400 mb-1">{t('accountStatus.realizedPnL')}</p>
          <p
            className={`text-lg font-semibold ${
              accountState.realizedPnL >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            ${accountState.realizedPnL.toFixed(2)}
          </p>
        </div>

        <div className="bg-gray-700/50 rounded p-3">
          <p className="text-xs text-gray-400 mb-1">{t('accountStatus.realizedPnLPercent')}</p>
          <p
            className={`text-lg font-semibold ${
              accountState.realizedPnLPercent >= 0
                ? 'text-green-400'
                : 'text-red-400'
            }`}
          >
            {accountState.realizedPnLPercent.toFixed(2)}%
          </p>
        </div>

        <div className="bg-gray-700/50 rounded p-3">
          <p className="text-xs text-gray-400 mb-1">{t('accountStatus.floatingPnL')}</p>
          <p
            className={`text-lg font-semibold ${
              accountState.floatingPnL >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            ${accountState.floatingPnL.toFixed(2)}
          </p>
        </div>

        <div className="bg-gray-700/50 rounded p-3">
          <p className="text-xs text-gray-400 mb-1">{t('accountStatus.floatingPnLPercent')}</p>
          <p
            className={`text-lg font-semibold ${
              accountState.floatingPnLPercent >= 0
                ? 'text-green-400'
                : 'text-red-400'
            }`}
          >
            {accountState.floatingPnLPercent.toFixed(2)}%
          </p>
        </div>

        <div className="bg-gray-700/50 rounded p-3">
          <p className="text-xs text-gray-400 mb-1">{t('accountStatus.positionRatio')}</p>
          <p className="text-lg font-semibold text-white">
            {(accountState.positionRatio * 100).toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Strategy Summary */}
      {strategy && (
        <div className="bg-gray-700/30 rounded p-3">
          <h3 className="text-sm font-medium text-white mb-2">{t('accountStatus.currentStrategy')}: {strategy.name}</h3>
          
          {/* Buy Conditions */}
          {strategy.buyConditions.some(g => g.conditions.length > 0) && (
            <div className="mb-2">
              <p className="text-xs text-green-400 mb-1">{t('strategyConfigurator.buyConditions')}:</p>
              <div className="text-xs text-gray-300 space-y-1">
                {strategy.buyConditions.map((group) => (
                  group.conditions.length > 0 && (
                    <div key={group.id}>
                      {group.conditions.map((cond, cidx) => (
                        <span key={cond.id}>
                          {cidx > 0 && <span className="text-gray-500"> {t(`logic.${group.logic}`)} </span>}
                          {t(`variables.${cond.variable}`)} {t(`operators.${cond.operator}`)} {cond.value}
                        </span>
                      ))}
                    </div>
                  )
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {t('strategyConfigurator.buyConfig')}: {strategy.buyConfig.amountType === 'amount' ? `${t('strategyConfigurator.amount')} $${strategy.buyConfig.value}` : 
                       strategy.buyConfig.amountType === 'quantity' ? `${t('strategyConfigurator.quantity')} ${strategy.buyConfig.value}` :
                       `${t('strategyConfigurator.ratio')} ${strategy.buyConfig.value}%`}
              </p>
            </div>
          )}
          
          {/* Sell Conditions */}
          {strategy.sellConditions.some(g => g.conditions.length > 0) && (
            <div>
              <p className="text-xs text-red-400 mb-1">{t('strategyConfigurator.sellConditions')}:</p>
              <div className="text-xs text-gray-300 space-y-1">
                {strategy.sellConditions.map((group) => (
                  group.conditions.length > 0 && (
                    <div key={group.id}>
                      {group.conditions.map((cond, cidx) => (
                        <span key={cond.id}>
                          {cidx > 0 && <span className="text-gray-500"> {t(`logic.${group.logic}`)} </span>}
                          {t(`variables.${cond.variable}`)} {t(`operators.${cond.operator}`)} {cond.value}
                        </span>
                      ))}
                    </div>
                  )
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {t('strategyConfigurator.sellConfig')}: {strategy.sellConfig.amountType === 'amount' ? `${t('strategyConfigurator.amount')} $${strategy.sellConfig.value}` : 
                        strategy.sellConfig.amountType === 'quantity' ? `${t('strategyConfigurator.quantity')} ${strategy.sellConfig.value}` :
                        `${t('strategyConfigurator.ratio')} ${strategy.sellConfig.value}%`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Trade Records */}
      {showTrades && tradeRecords.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-md font-medium text-white">{t('accountStatus.tradeRecords')}</h3>
            <div className="text-xs text-gray-400 space-x-2">
              <span className="text-green-400">
                {t('accountStatus.totalBuys')}: {tradeRecords.filter(r => r.type === 'buy').length}
              </span>
              <span className="text-red-400">
                {t('accountStatus.totalSells')}: {tradeRecords.filter(r => r.type === 'sell').length}
              </span>
              <span className="text-gray-500">
                {t('accountStatus.totalTrades')}: {tradeRecords.length}
              </span>
            </div>
          </div>
          <div className="max-h-64 overflow-auto scrollbar-hide-hover">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="text-gray-400 sticky top-0 bg-gray-800">
                <tr>
                  <th className="text-left py-2">{t('accountStatus.time')}</th>
                  <th className="text-left py-2">{t('accountStatus.type')}</th>
                  <th className="text-right py-2">{t('accountStatus.price')}</th>
                  <th className="text-right py-2">{t('accountStatus.quantity')}</th>
                  <th className="text-right py-2">{t('accountStatus.tradeValue')}</th>
                  <th className="text-right py-2">{t('accountStatus.profit')}</th>
                </tr>
              </thead>
              <tbody>
                {tradeRecords
                  .slice()
                  .reverse()
                  .map((record) => {
                    const tradeValue = record.entryPrice * record.quantity;
                    return (
                      <tr
                        key={record.id}
                        className="border-t border-gray-700 hover:bg-gray-700/30"
                      >
                        <td className="py-2 text-gray-300">
                          {dayjs(record.time).format('MM-DD HH:mm')}
                        </td>
                        <td className="py-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              record.type === 'buy'
                                ? 'bg-green-900/50 text-green-400'
                                : 'bg-red-900/50 text-red-400'
                            }`}
                          >
                            {t(`accountStatus.${record.type}`)}
                          </span>
                        </td>
                        <td className="text-right py-2 text-gray-300">
                          ${record.entryPrice.toFixed(2)}
                        </td>
                        <td className="text-right py-2 text-gray-300">
                          {record.quantity.toFixed(6)}
                        </td>
                        <td className="text-right py-2 text-gray-300">
                          ${tradeValue.toFixed(2)}
                        </td>
                        <td
                          className={`text-right py-2 ${
                            record.profit !== undefined
                              ? record.profit >= 0
                                ? 'text-green-400'
                                : 'text-red-400'
                              : 'text-gray-500'
                          }`}
                        >
                          {record.profit !== undefined
                            ? `$${record.profit.toFixed(2)} (${record.profitPercent?.toFixed(2)}%)`
                            : '-'}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          <style>{`
            .scrollbar-hide-hover::-webkit-scrollbar {
              width: 6px;
              height: 6px;
            }
            .scrollbar-hide-hover::-webkit-scrollbar-track {
              background: transparent;
            }
            .scrollbar-hide-hover::-webkit-scrollbar-thumb {
              background: rgba(107, 114, 128, 0);
              border-radius: 3px;
            }
            .scrollbar-hide-hover:hover::-webkit-scrollbar-thumb {
              background: rgba(107, 114, 128, 0.5);
            }
            .scrollbar-hide-hover::-webkit-scrollbar-thumb:hover {
              background: rgba(107, 114, 128, 0.7);
            }
          `}</style>
        </div>
      )}
    </div>
  );
};
