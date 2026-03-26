import { useState, useEffect } from 'react';
import { useBacktestStore } from './store/backtestStore';
import { MarketDataSelector } from './components/MarketDataSelector';
import { StrategyConfigurator } from './components/StrategyConfigurator';
import { AccountStatus } from './components/AccountStatus';
import { PlaybackControls } from './components/PlaybackControls';
import { InitialCapitalInput } from './components/InitialCapitalInput';
import { KlineChart } from './components/KlineChart';
import type { Strategy } from './types';
import dayjs from 'dayjs';

function App() {
  const { backtestState, settings } = useBacktestStore();
  const [showCapitalInput, setShowCapitalInput] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showStrategyConfig, setShowStrategyConfig] = useState(false);
  const [windowWidth, setWindowWidth] = useState(800);

  useEffect(() => {
    // 获取窗口宽度
    setWindowWidth(typeof window !== 'undefined' ? window.innerWidth : 800);
    
    // 监听窗口大小变化
    const handleResize = () => {
      setWindowWidth(typeof window !== 'undefined' ? window.innerWidth : 800);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDataLoaded = () => {
    console.log('数据加载回调被调用');
    setDataLoaded(true);
    setShowCapitalInput(false);
  };

  const handleStrategySave = (strategy: Strategy) => {
    console.log('Strategy saved:', strategy);
    // 保存成功后自动隐藏策略配置
    setShowStrategyConfig(false);
  };

  const handleStartBacktest = () => {
    setShowCapitalInput(false);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-white">
            加密市场回测平台
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            基于历史数据的交易策略回测分析
          </p>
        </div>
      </header>

      {/* Initial Capital Input Modal */}
      {showCapitalInput && dataLoaded && (
        <InitialCapitalInput onSubmit={handleStartBacktest} />
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Controls */}
          <div className="space-y-6">
            {/* Market Data Selector */}
            {!dataLoaded && (
              <MarketDataSelector onDataLoaded={handleDataLoaded} />
            )}

            {/* Strategy Configurator Toggle */}
            {dataLoaded && (
              <>
                <button
                  onClick={() => setShowStrategyConfig(!showStrategyConfig)}
                  className="w-full py-2 bg-gray-800 text-white rounded hover:bg-gray-700 font-medium"
                >
                  {showStrategyConfig ? '隐藏策略配置' : '显示策略配置'}
                </button>

                {showStrategyConfig && (
                  <StrategyConfigurator onSave={handleStrategySave} />
                )}
              </>
            )}

            {/* Account Status */}
            {dataLoaded && <AccountStatus showTrades={true} />}
          </div>

          {/* Right Column - Chart and Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Kline Chart */}
            {dataLoaded && backtestState.klineData.length > 0 ? (
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex flex-col gap-2 mb-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">
                      {settings.asset?.symbol || ''} K 线图
                    </h2>
                    <div className="text-sm text-gray-400">
                      周期：{settings.timeFrame}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    回测片段：{dayjs(backtestState.klineData[0]?.time).format('YYYY-MM-DD HH:mm')} 
                    {backtestState.klineData[backtestState.currentPeriodIndex] && 
                      ` → ${dayjs(backtestState.klineData[backtestState.currentPeriodIndex].time).format('YYYY-MM-DD HH:mm')}`
                    }
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <KlineChart
                    data={backtestState.klineData}
                    currentPeriodIndex={backtestState.currentPeriodIndex}
                    width={Math.min(800, windowWidth - 48)}
                    height={400}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg p-12 text-center">
                <div className="text-gray-400">
                  <svg
                    className="w-16 h-16 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                    />
                  </svg>
                  <p className="text-lg mb-2">请选择市场数据开始回测</p>
                  <p className="text-sm">
                    在左侧面板选择资产、时间周期和时间范围
                  </p>
                </div>
              </div>
            )}

            {/* Playback Controls */}
            {dataLoaded && backtestState.klineData.length > 0 && (
              <PlaybackControls />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 mt-8">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-gray-400">
          <p>数据来源：Binance API | 仅供学习研究使用</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
