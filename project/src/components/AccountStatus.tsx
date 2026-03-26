import React from 'react';
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
  const { backtestState } = useBacktestStore();
  const { accountState, tradeRecords, strategy } = backtestState;

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
      <h2 className="text-lg font-semibold text-white">账户状态</h2>

      {/* Core Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-gray-700/50 rounded p-3">
          <p className="text-xs text-gray-400 mb-1">当前权益</p>
          <p className="text-lg font-semibold text-white">
            ${accountState.equity.toFixed(2)}
          </p>
        </div>

        <div className="bg-gray-700/50 rounded p-3">
          <p className="text-xs text-gray-400 mb-1">可用资金</p>
          <p className="text-lg font-semibold text-white">
            ${accountState.availableFunds.toFixed(2)}
          </p>
        </div>

        <div className="bg-gray-700/50 rounded p-3">
          <p className="text-xs text-gray-400 mb-1">持仓数量</p>
          <p className="text-lg font-semibold text-white">
            {accountState.position.toFixed(6)}
          </p>
        </div>

        <div className="bg-gray-700/50 rounded p-3">
          <p className="text-xs text-gray-400 mb-1">已实现盈亏</p>
          <p
            className={`text-lg font-semibold ${
              accountState.realizedPnL >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            ${accountState.realizedPnL.toFixed(2)}
          </p>
        </div>

        <div className="bg-gray-700/50 rounded p-3">
          <p className="text-xs text-gray-400 mb-1">已实现收益率</p>
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
          <p className="text-xs text-gray-400 mb-1">浮盈亏</p>
          <p
            className={`text-lg font-semibold ${
              accountState.floatingPnL >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            ${accountState.floatingPnL.toFixed(2)}
          </p>
        </div>

        <div className="bg-gray-700/50 rounded p-3">
          <p className="text-xs text-gray-400 mb-1">浮盈亏率</p>
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
          <p className="text-xs text-gray-400 mb-1">持仓占比</p>
          <p className="text-lg font-semibold text-white">
            {(accountState.positionRatio * 100).toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Strategy Summary */}
      {strategy && (
        <div className="bg-gray-700/30 rounded p-3">
          <h3 className="text-sm font-medium text-white mb-2">当前策略: {strategy.name}</h3>
          
          {/* Buy Conditions */}
          {strategy.buyConditions.some(g => g.conditions.length > 0) && (
            <div className="mb-2">
              <p className="text-xs text-green-400 mb-1">买入条件:</p>
              <div className="text-xs text-gray-300 space-y-1">
                {strategy.buyConditions.map((group, idx) => (
                  group.conditions.length > 0 && (
                    <div key={group.id}>
                      {group.conditions.map((cond, cidx) => (
                        <span key={cond.id}>
                          {cidx > 0 && <span className="text-gray-500"> {group.logic === 'and' ? '且' : '或'} </span>}
                          {VARIABLE_LABELS[cond.variable]} {OPERATOR_LABELS[cond.operator]} {cond.value}
                        </span>
                      ))}
                    </div>
                  )
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                买入: {strategy.buyConfig.amountType === 'amount' ? `金额 $${strategy.buyConfig.value}` : 
                       strategy.buyConfig.amountType === 'quantity' ? `数量 ${strategy.buyConfig.value}` :
                       `资金 ${strategy.buyConfig.value}%`}
              </p>
            </div>
          )}
          
          {/* Sell Conditions */}
          {strategy.sellConditions.some(g => g.conditions.length > 0) && (
            <div>
              <p className="text-xs text-red-400 mb-1">卖出条件:</p>
              <div className="text-xs text-gray-300 space-y-1">
                {strategy.sellConditions.map((group, idx) => (
                  group.conditions.length > 0 && (
                    <div key={group.id}>
                      {group.conditions.map((cond, cidx) => (
                        <span key={cond.id}>
                          {cidx > 0 && <span className="text-gray-500"> {group.logic === 'and' ? '且' : '或'} </span>}
                          {VARIABLE_LABELS[cond.variable]} {OPERATOR_LABELS[cond.operator]} {cond.value}
                        </span>
                      ))}
                    </div>
                  )
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                卖出: {strategy.sellConfig.amountType === 'amount' ? `金额 $${strategy.sellConfig.value}` : 
                        strategy.sellConfig.amountType === 'quantity' ? `数量 ${strategy.sellConfig.value}` :
                        `持仓 ${strategy.sellConfig.value}%`}
              </p>
            </div>
          )}
          
          {!strategy.buyConditions.some(g => g.conditions.length > 0) && 
           !strategy.sellConditions.some(g => g.conditions.length > 0) && (
            <p className="text-xs text-gray-500">未配置任何条件</p>
          )}
        </div>
      )}

      {/* Trade Records */}
      {showTrades && tradeRecords.length > 0 && (
        <div>
          <h3 className="text-md font-medium text-white mb-3">成交记录</h3>
          <div className="max-h-64 overflow-auto scrollbar-hide-hover">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="text-gray-400 sticky top-0 bg-gray-800">
                <tr>
                  <th className="text-left py-2">时间</th>
                  <th className="text-left py-2">类型</th>
                  <th className="text-right py-2">价格</th>
                  <th className="text-right py-2">数量</th>
                  <th className="text-right py-2">交易资金</th>
                  <th className="text-right py-2">盈亏</th>
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
                            {record.type === 'buy' ? '买入' : '卖出'}
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
