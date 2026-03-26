import { useState, useEffect } from 'react';
import { useBacktestStore } from '../store/backtestStore';
import { fetchKlineData } from '../services/okx';
import type { Asset, TimeFrame } from '../types';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

interface MarketDataSelectorProps {
  onDataLoaded: () => void;
}

const AVAILABLE_ASSETS: Asset[] = [
  { symbol: 'BTC-USDT', baseAsset: 'BTC', quoteAsset: 'USDT' },
  { symbol: 'ETC-USDT', baseAsset: 'ETC', quoteAsset: 'USDT' },
];

export const MarketDataSelector: React.FC<MarketDataSelectorProps> = ({
  onDataLoaded,
}) => {
  const { settings, updateSettings, setKlineData, setInitialCapital } = useBacktestStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialCapitalInput, setInitialCapitalInput] = useState(settings.initialCapital.toString());

  // 初始化默认时间为今天的 00:00
  useEffect(() => {
    if (settings.startTime === 0) {
      const defaultTime = dayjs().hour(0).minute(0).second(0).millisecond(0).valueOf();
      updateSettings({ startTime: defaultTime });
    }
  }, []);

  const getEndTimeFromStartTime = (startTime: number, timeFrame: TimeFrame): number => {
    const maxPeriods = 1000;
    let milliseconds: number;
    
    switch (timeFrame) {
      case '1h':
        milliseconds = maxPeriods * 60 * 60 * 1000;
        break;
      case '1d':
        milliseconds = maxPeriods * 24 * 60 * 60 * 1000;
        break;
      case '1w':
        milliseconds = maxPeriods * 7 * 24 * 60 * 60 * 1000;
        break;
      case '1M':
        milliseconds = maxPeriods * 30 * 24 * 60 * 60 * 1000;
        break;
      default:
        milliseconds = maxPeriods * 24 * 60 * 60 * 1000;
    }
    
    return startTime + milliseconds;
  };

  const handleLoadData = async () => {
    console.log('=== 开始加载数据 ===');
    console.log('当前设置:', {
      asset: settings.asset,
      timeFrame: settings.timeFrame,
      startTime: settings.startTime,
      startTimeISO: settings.startTime ? new Date(settings.startTime).toISOString() : '未选择',
    });

    if (!settings.asset) {
      const msg = '请选择标的';
      console.error(msg);
      setError(msg);
      return;
    }

    if (!settings.startTime || settings.startTime === 0) {
      const msg = '请选择开始时间';
      console.error(msg);
      setError(msg);
      return;
    }

    // 计算结束时间（最多1000个周期）
    const maxEndTime = getEndTimeFromStartTime(settings.startTime, settings.timeFrame);
    // 先加载前100个周期
    const initialEndTime = Math.min(
      settings.startTime + 100 * getPeriodMilliseconds(settings.timeFrame),
      maxEndTime,
      Date.now()
    );
    
    console.log('计算的时间范围:', {
      startTime: settings.startTime,
      startTimeISO: new Date(settings.startTime).toISOString(),
      maxEndTime: maxEndTime,
      initialEndTime: initialEndTime,
      timeFrame: settings.timeFrame,
    });

    // 设置初始资金
    const capital = parseFloat(initialCapitalInput);
    if (!isNaN(capital) && capital > 0) {
      setInitialCapital(capital);
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('调用 fetchKlineData 加载前100个周期...');
      const data = await fetchKlineData(
        settings.asset.symbol,
        settings.timeFrame,
        settings.startTime,
        initialEndTime
      );

      console.log('fetchKlineData 返回数据量:', data.length);

      if (data.length === 0) {
        const msg = '未找到数据，请尝试其他时间范围';
        console.error(msg, {
          symbol: settings.asset.symbol,
          timeFrame: settings.timeFrame,
          startTime: new Date(settings.startTime).toISOString(),
          endTime: new Date(initialEndTime).toISOString(),
        });
        setError(msg);
        setIsLoading(false);
        return;
      }

      // 准备数据加载配置，用于后续动态加载
      const lastDataTime = data[data.length - 1]?.time || settings.startTime;
      const loadConfig = {
        symbol: settings.asset.symbol,
        timeFrame: settings.timeFrame,
        nextStartTime: lastDataTime + 1,
        endTime: maxEndTime,
        batchSize: 100, // 每次加载100个周期
      };

      console.log('设置 K 线数据，准备回调...');
      setKlineData(data, loadConfig);
      onDataLoaded();
      console.log('数据加载完成！已加载', data.length, '个周期');
      
      if (data.length < 100) {
        setError(`仅加载到 ${data.length} 个周期，可能已到达最新数据`);
      }
    } catch (err) {
      const msg = '加载数据失败，请稍后重试';
      console.error(msg, err);
      setError(msg);
      alert(`${msg}\n\n错误详情：${err instanceof Error ? err.message : String(err)}\n\n请打开浏览器控制台查看完整日志`);
    } finally {
      setIsLoading(false);
      console.log('=== 数据加载结束 ===');
    }
  };
  
  // 获取周期毫秒数
  const getPeriodMilliseconds = (timeFrame: TimeFrame): number => {
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

  const handleTimeFrameChange = (timeFrame: TimeFrame) => {
    updateSettings({ timeFrame });
    // 重置开始时间为今天的 00:00，避免周期切换后时间格式不匹配
    const defaultTime = dayjs().hour(0).minute(0).second(0).millisecond(0).valueOf();
    updateSettings({ startTime: defaultTime });
  };

  const getTimeFormat = (timeFrame: TimeFrame): string => {
    switch (timeFrame) {
      case '1h':
        return 'YYYY-MM-DDTHH:00'; // 小时周期，分钟固定为 00
      case '1d':
        return 'YYYY-MM-DD';
      case '1w':
        return 'YYYY-MM-DD';
      default:
        return 'YYYY-MM-DD';
    }
  };

  const formatTimeForInput = (timestamp: number, timeFrame: TimeFrame): string => {
    if (!timestamp) return '';
    const format = getTimeFormat(timeFrame);
    return dayjs(timestamp).format(format);
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value) return;
    
    let time: dayjs.Dayjs;
    
    // 根据周期类型调整时间精度
    if (settings.timeFrame === '1h') {
      // 小时周期：输入格式为 YYYY-MM-DDTHH:mm
      // 分钟固定为 00
      time = dayjs(value).minute(0).second(0).millisecond(0);
    } else if (settings.timeFrame === '1d' || settings.timeFrame === '1w') {
      // 天/周周期：输入格式为 YYYY-MM-DD
      // 使用 UTC 时间，确保是当天的 00:00:00 UTC
      time = dayjs.utc(value + 'T00:00:00');
    } else {
      time = dayjs(value);
    }
    
    console.log('Selected time:', {
      inputValue: value,
      timestamp: time.valueOf(),
      isoString: time.toISOString(),
      timeFrame: settings.timeFrame,
    });
    
    updateSettings({ startTime: time.valueOf() });
  };

  // 点击输入框时触发文件选择器
  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    // 确保输入框获得焦点并显示选择器
    (e.target as HTMLInputElement).showPicker?.();
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
      <h2 className="text-lg font-semibold text-white">市场数据选择</h2>

      {/* Asset Selection */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">选择标的</label>
        <select
          value={settings.asset?.symbol || ''}
          onChange={(e) => {
            const selectedSymbol = e.target.value;
            const selectedAsset = AVAILABLE_ASSETS.find((a) => a.symbol === selectedSymbol);
            if (selectedAsset) {
              updateSettings({ asset: selectedAsset });
            }
          }}
          className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:outline-none focus:border-blue-500"
        >
          <option value="">请选择标的</option>
          {AVAILABLE_ASSETS.map((asset) => (
            <option key={asset.symbol} value={asset.symbol}>
              {asset.baseAsset}/{asset.quoteAsset}
            </option>
          ))}
        </select>
      </div>

      {/* Time Frame Selection */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">时间周期</label>
        <div className="grid grid-cols-3 gap-2">
          {(['1h', '1d', '1w'] as TimeFrame[]).map((tf) => (
            <button
              key={tf}
              onClick={() => handleTimeFrameChange(tf)}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                settings.timeFrame === tf
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tf === '1h' && '小时'}
              {tf === '1d' && '天'}
              {tf === '1w' && '周'}
            </button>
          ))}
        </div>
      </div>

      {/* Start Time */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">
          开始时间
          <span className="text-xs text-gray-500 ml-2">
            ({settings.timeFrame === '1h' ? '精确到小时（分钟固定为 00）' : '精确到日期'})
          </span>
        </label>
        <input
          type={settings.timeFrame === '1h' ? 'datetime-local' : 'date'}
          value={formatTimeForInput(settings.startTime, settings.timeFrame)}
          onChange={handleStartTimeChange}
          onClick={handleInputClick}
          className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:outline-none focus:border-blue-500 [color-scheme:dark]"
          style={{
            cursor: 'pointer',
          }}
        />
      </div>

      {/* Initial Capital */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">初始资产 (USDT)</label>
        <input
          type="text"
          value={initialCapitalInput}
          onChange={(e) => {
            const val = e.target.value;
            if (val === '' || /^\d*\.?\d*$/.test(val)) {
              setInitialCapitalInput(val);
            }
          }}
          onBlur={() => {
            const num = parseFloat(initialCapitalInput);
            if (!isNaN(num) && num > 0) {
              setInitialCapital(num);
              setInitialCapitalInput(num.toString());
            } else {
              setInitialCapitalInput(settings.initialCapital.toString());
            }
          }}
          className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:outline-none focus:border-blue-500"
          placeholder="请输入初始资产"
        />
      </div>

      {/* Info Display */}
      {settings.startTime > 0 && (
        <div className="bg-blue-900/20 border border-blue-700 rounded p-3">
          <p className="text-sm text-blue-300">
            <span className="font-medium">提示：</span>
            从开始时间起最多回测 1000 个周期
          </p>
          <p className="text-xs text-blue-400 mt-2">
            预计结束时间：{dayjs(getEndTimeFromStartTime(settings.startTime, settings.timeFrame)).format(getTimeFormat(settings.timeFrame))}
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded">
          {error}
        </div>
      )}

      {/* Start Backtest Button */}
      <button
        onClick={handleLoadData}
        disabled={isLoading || !settings.asset || settings.startTime <= 0}
        className={`w-full py-2 rounded font-medium transition-colors ${
          isLoading || !settings.asset || settings.startTime <= 0
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
      >
        {isLoading ? '加载中...' : '开始回测'}
      </button>
    </div>
  );
};
