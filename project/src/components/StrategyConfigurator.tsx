import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useBacktestStore } from '../store/backtestStore';
import type {
  Condition,
  ConditionGroup,
  VariableType,
  Operator,
  TradeAmountType,
  Strategy,
} from '../types';

interface StrategyConfiguratorProps {
  onSave?: (strategy: Strategy) => void;
}

interface ConditionInputProps {
  condition: Condition;
  condIndex: number;
  groupLogic: 'and' | 'or';
  type: 'buy' | 'sell';
  groupId: string;
  onUpdate: (
    type: 'buy' | 'sell',
    groupId: string,
    conditionId: string,
    updates: Partial<Condition>
  ) => void;
  onRemove: (type: 'buy' | 'sell', groupId: string, conditionId: string) => void;
}

const ConditionInput: React.FC<ConditionInputProps> = ({
  condition,
  condIndex,
  groupLogic,
  type,
  groupId,
  onUpdate,
  onRemove,
}) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState(
    Object.is(condition.value, -0) ? '0' : condition.value.toString()
  );
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setInputValue(Object.is(condition.value, -0) ? '0' : condition.value.toString());
    }
  }, [condition.value, isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || val === '-' || /^-?\d*\.?\d*$/.test(val)) {
      setInputValue(val);
    }
  };

  const handleFocus = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (inputValue === '-' || inputValue === '') {
      setInputValue('0');
      onUpdate(type, groupId, condition.id, { value: 0 });
    } else {
      const num = parseFloat(inputValue);
      if (!isNaN(num)) {
        setInputValue(num.toString());
        onUpdate(type, groupId, condition.id, { value: num });
      }
    }
  };

  const getVariableLabel = (variable: VariableType) => t(`variables.${variable}`);
  const getOperatorLabel = (operator: Operator) => t(`operators.${operator}`);

  return (
    <div className="flex items-center gap-2">
      {condIndex > 0 && (
        <span className="text-xs text-gray-500">
          {t(`logic.${groupLogic}`)}
        </span>
      )}

      <select
        value={condition.variable}
        onChange={(e) =>
          onUpdate(type, groupId, condition.id, {
            variable: e.target.value as VariableType,
          })
        }
        className="bg-gray-600 text-white text-sm rounded px-2 py-1 border border-gray-500 focus:outline-none flex-1"
      >
        {Object.keys({
          open: '', close: '', high: '', low: '', volume: '', 
          equity: '', availableFunds: '', position: '', 
          floatingPnL: '', floatingPnLPercent: '', positionRatio: ''
        }).map((value) => (
          <option key={value} value={value}>
            {getVariableLabel(value as VariableType)}
          </option>
        ))}
      </select>

      <select
        value={condition.operator}
        onChange={(e) =>
          onUpdate(type, groupId, condition.id, {
            operator: e.target.value as Operator,
          })
        }
        className="bg-gray-600 text-white text-sm rounded px-2 py-1 border border-gray-500 focus:outline-none"
      >
        <option value="greater">{getOperatorLabel('greater')}</option>
        <option value="less">{getOperatorLabel('less')}</option>
        <option value="greaterOrEqual">{getOperatorLabel('greaterOrEqual')}</option>
        <option value="lessOrEqual">{getOperatorLabel('lessOrEqual')}</option>
      </select>

      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="bg-gray-600 text-white text-sm rounded px-2 py-1 border border-gray-500 focus:outline-none w-24"
      />

      <button
        onClick={() => onRemove(type, groupId, condition.id)}
        className="text-red-400 hover:text-red-300 text-sm px-2"
      >
        ×
      </button>
    </div>
  );
};

export const StrategyConfigurator: React.FC<StrategyConfiguratorProps> = ({
  onSave,
}) => {
  const { t } = useTranslation();
  const { setStrategy, backtestState } = useBacktestStore();
  const savedStrategy = backtestState.strategy;
  
  const [strategyName, setStrategyName] = useState(savedStrategy?.name || t('strategyConfigurator.defaultStrategyName'));
  const [buyConditions, setBuyConditions] = useState<ConditionGroup[]>(
    savedStrategy?.buyConditions || [{ id: 'buy-group-1', conditions: [], logic: 'and' }]
  );
  const [sellConditions, setSellConditions] = useState<ConditionGroup[]>(
    savedStrategy?.sellConditions || [{ id: 'sell-group-1', conditions: [], logic: 'and' }]
  );
  const [buyAmountType, setBuyAmountType] = useState<TradeAmountType>(
    savedStrategy?.buyConfig?.amountType || 'ratio'
  );
  const [sellAmountType, setSellAmountType] = useState<TradeAmountType>(
    savedStrategy?.sellConfig?.amountType || 'ratio'
  );
  const [buyValue, setBuyValue] = useState(savedStrategy?.buyConfig?.value || 50);
  const [sellValue, setSellValue] = useState(savedStrategy?.sellConfig?.value || 100);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const createCondition = (): Condition => ({
    id: `cond-${Date.now()}-${Math.random()}`,
    variable: 'close',
    operator: 'greater',
    value: 0,
  });

  const addCondition = (type: 'buy' | 'sell', groupId: string) => {
    const newCondition = createCondition();
    if (type === 'buy') {
      setBuyConditions((prev) =>
        prev.map((group) =>
          group.id === groupId
            ? { ...group, conditions: [...group.conditions, newCondition] }
            : group
        )
      );
    } else {
      setSellConditions((prev) =>
        prev.map((group) =>
          group.id === groupId
            ? { ...group, conditions: [...group.conditions, newCondition] }
            : group
        )
      );
    }
  };

  const updateCondition = (
    type: 'buy' | 'sell',
    groupId: string,
    conditionId: string,
    updates: Partial<Condition>
  ) => {
    const setter = type === 'buy' ? setBuyConditions : setSellConditions;
    setter((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              conditions: group.conditions.map((cond) =>
                cond.id === conditionId ? { ...cond, ...updates } : cond
              ),
            }
          : group
      )
    );
  };

  const removeCondition = (
    type: 'buy' | 'sell',
    groupId: string,
    conditionId: string
  ) => {
    const setter = type === 'buy' ? setBuyConditions : setSellConditions;
    setter((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              conditions: group.conditions.filter(
                (cond) => cond.id !== conditionId
              ),
            }
          : group
      )
    );
  };

  const addConditionGroup = (type: 'buy' | 'sell') => {
    const newGroup: ConditionGroup = {
      id: `${type}-group-${Date.now()}`,
      conditions: [],
      logic: 'and',
    };
    if (type === 'buy') {
      setBuyConditions((prev) => [...prev, newGroup]);
    } else {
      setSellConditions((prev) => [...prev, newGroup]);
    }
  };

  const removeConditionGroup = (type: 'buy' | 'sell', groupId: string) => {
    const setter = type === 'buy' ? setBuyConditions : setSellConditions;
    setter((prev) => prev.filter((group) => group.id !== groupId));
  };

  const updateGroupLogic = (
    type: 'buy' | 'sell',
    groupId: string,
    logic: 'and' | 'or'
  ) => {
    const setter = type === 'buy' ? setBuyConditions : setSellConditions;
    setter((prev) =>
      prev.map((group) =>
        group.id === groupId ? { ...group, logic } : group
      )
    );
  };

  const handleSave = () => {
    const strategy: Strategy = {
      id: `strategy-${Date.now()}`,
      name: strategyName,
      buyConditions,
      sellConditions,
      buyConfig: {
        type: 'buy',
        amountType: buyAmountType,
        value: buyValue,
      },
      sellConfig: {
        type: 'sell',
        amountType: sellAmountType,
        value: sellValue,
      },
    };

    setStrategy(strategy);
    onSave?.(strategy);
    
    setSaveMessage(t('strategyConfigurator.saveSuccess'));
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const ConditionEditor = ({
    type,
    groups,
  }: {
    type: 'buy' | 'sell';
    groups: ConditionGroup[];
  }) => (
    <div className="space-y-4">
      {groups.map((group, groupIndex) => (
        <div key={group.id} className="bg-gray-700/50 rounded p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">
                {t('strategyConfigurator.conditionGroup')} {groupIndex + 1}
              </span>
              {group.conditions.length > 1 && (
                <select
                  value={group.logic}
                  onChange={(e) =>
                    updateGroupLogic(type, group.id, e.target.value as 'and' | 'or')
                  }
                  className="bg-gray-600 text-white text-xs rounded px-2 py-1 border border-gray-500 focus:outline-none"
                >
                  <option value="and">{t('logic.and')} (AND)</option>
                  <option value="or">{t('logic.or')} (OR)</option>
                </select>
              )}
            </div>
            {groups.length > 1 && (
              <button
                onClick={() => removeConditionGroup(type, group.id)}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                {t('strategyConfigurator.deleteGroup')}
              </button>
            )}
          </div>

          <div className="space-y-2">
            {group.conditions.map((condition, condIndex) => (
              <ConditionInput
                key={condition.id}
                condition={condition}
                condIndex={condIndex}
                groupLogic={group.logic}
                type={type}
                groupId={group.id}
                onUpdate={updateCondition}
                onRemove={removeCondition}
              />
            ))}
          </div>

          <button
            onClick={() => addCondition(type, group.id)}
            className="mt-3 text-blue-400 hover:text-blue-300 text-sm"
          >
            + {t('strategyConfigurator.addCondition')}
          </button>
        </div>
      ))}

      <button
        onClick={() => addConditionGroup(type)}
        className="w-full py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 text-sm"
      >
        + {t('strategyConfigurator.addGroup')}
      </button>
    </div>
  );

  const getBuyHint = () => {
    if (buyAmountType === 'amount') return t('strategyConfigurator.buyAmountHint');
    if (buyAmountType === 'quantity') return t('strategyConfigurator.buyQuantityHint');
    return t('strategyConfigurator.buyRatioHint');
  };

  const getSellHint = () => {
    if (sellAmountType === 'amount') return t('strategyConfigurator.sellAmountHint');
    if (sellAmountType === 'quantity') return t('strategyConfigurator.sellQuantityHint');
    return t('strategyConfigurator.sellRatioHint');
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-6">
      <h2 className="text-lg font-semibold text-white">{t('strategyConfigurator.title')}</h2>

      <div>
        <label className="block text-sm text-gray-400 mb-2">{t('strategyConfigurator.strategyName')}</label>
        <input
          type="text"
          value={strategyName}
          onChange={(e) => setStrategyName(e.target.value)}
          className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-green-400 font-medium">{t('strategyConfigurator.buyConditions')}</h3>
        </div>
        <ConditionEditor type="buy" groups={buyConditions} />
      </div>

      <div className="bg-gray-700/50 rounded p-4">
        <h4 className="text-sm text-gray-400 mb-3">{t('strategyConfigurator.buyConfig')}</h4>
        <div className="grid grid-cols-3 gap-3">
          <select
            value={buyAmountType}
            onChange={(e) => setBuyAmountType(e.target.value as TradeAmountType)}
            className="bg-gray-600 text-white text-sm rounded px-2 py-2 border border-gray-500 focus:outline-none"
          >
            <option value="amount">{t('strategyConfigurator.byAmount')}</option>
            <option value="quantity">{t('strategyConfigurator.byQuantity')}</option>
            <option value="ratio">{t('strategyConfigurator.byRatio')}</option>
          </select>
          <input
            type="number"
            value={buyValue}
            onChange={(e) => setBuyValue(parseFloat(e.target.value) || 0)}
            className="bg-gray-600 text-white text-sm rounded px-2 py-2 border border-gray-500 focus:outline-none col-span-2"
            step="any"
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {getBuyHint()}
        </p>
      </div>

      <div>
        <h3 className="text-red-400 font-medium mb-3">{t('strategyConfigurator.sellConditions')}</h3>
        <ConditionEditor type="sell" groups={sellConditions} />
      </div>

      <div className="bg-gray-700/50 rounded p-4">
        <h4 className="text-sm text-gray-400 mb-3">{t('strategyConfigurator.sellConfig')}</h4>
        <div className="grid grid-cols-3 gap-3">
          <select
            value={sellAmountType}
            onChange={(e) => setSellAmountType(e.target.value as TradeAmountType)}
            className="bg-gray-600 text-white text-sm rounded px-2 py-2 border border-gray-500 focus:outline-none"
          >
            <option value="amount">{t('strategyConfigurator.byAmount')}</option>
            <option value="quantity">{t('strategyConfigurator.byQuantity')}</option>
            <option value="ratio">{t('strategyConfigurator.byRatio')}</option>
          </select>
          <input
            type="number"
            value={sellValue}
            onChange={(e) => setSellValue(parseFloat(e.target.value) || 0)}
            className="bg-gray-600 text-white text-sm rounded px-2 py-2 border border-gray-500 focus:outline-none col-span-2"
            step="any"
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {getSellHint()}
        </p>
      </div>

      {saveMessage && (
        <div className="bg-green-900/50 border border-green-600 text-green-400 px-4 py-2 rounded text-center">
          {saveMessage}
        </div>
      )}

      <button
        onClick={handleSave}
        className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
      >
        {t('strategyConfigurator.saveStrategy')}
      </button>
    </div>
  );
};
