import { useEffect } from 'react';
import { useBacktestStore } from '../store/backtestStore';
import dayjs from 'dayjs';

interface PlaybackControlsProps {
  onPeriodChange?: (index: number) => void;
}

const SPEED_OPTIONS = [
  { label: '0.5s', value: 500 },
  { label: '1s', value: 1000 },
  { label: '3s', value: 3000 },
  { label: '5s', value: 5000 },
];

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  onPeriodChange,
}) => {
  const {
    backtestState,
    play,
    pause,
    replay,
    nextPeriod,
    previousPeriod,
    isLoadingMore,
    hasMoreData,
    playbackSpeed,
    setPlaybackSpeed,
  } = useBacktestStore();

  const {
    isPlaying,
    currentPeriodIndex,
    totalPeriods,
    klineData,
  } = backtestState;

  // Auto-play effect
  useEffect(() => {
    if (!isPlaying) return;
    if (currentPeriodIndex >= totalPeriods - 1) {
      pause();
      return;
    }

    const timer = setInterval(() => {
      nextPeriod();
    }, playbackSpeed);

    return () => clearInterval(timer);
  }, [isPlaying, currentPeriodIndex, totalPeriods, nextPeriod, pause, playbackSpeed]);

  // Notify parent of period change
  useEffect(() => {
    onPeriodChange?.(currentPeriodIndex);
  }, [currentPeriodIndex, onPeriodChange]);

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      if (currentPeriodIndex >= totalPeriods - 1) {
        // If at the end, replay first
        replay();
        setTimeout(() => play(), 100);
      } else {
        play();
      }
    }
  };

  const handleNext = () => {
    if (currentPeriodIndex < totalPeriods - 1) {
      nextPeriod();
    }
  };

  const handlePrevious = () => {
    if (currentPeriodIndex > 0) {
      previousPeriod();
    }
  };

  const handleReplay = () => {
    pause();
    setTimeout(() => replay(), 100);
  };

  const progress = totalPeriods > 0 ? ((currentPeriodIndex + 1) / totalPeriods) * 100 : 0;
  const currentKline = klineData[currentPeriodIndex];

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
      <h2 className="text-lg font-semibold text-white">回测控制</h2>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-400">
          <span>进度</span>
          <span>
            {currentPeriodIndex + 1} / {totalPeriods}
            {isLoadingMore && <span className="text-yellow-400 ml-2">(加载中...)</span>}
            {!hasMoreData && currentPeriodIndex >= totalPeriods - 1 && (
              <span className="text-gray-500 ml-2">(已结束)</span>
            )}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Current Period Info */}
      {currentKline && (
        <div className="bg-gray-700/50 rounded p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">当前周期</span>
            <span className="text-sm text-white font-medium">
              {dayjs(currentKline.time).format('YYYY-MM-DD HH:mm')}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-xs text-gray-500">开盘</p>
              <p className="text-sm text-white">${currentKline.open.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">最高</p>
              <p className="text-sm text-green-400">${currentKline.high.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">最低</p>
              <p className="text-sm text-red-400">${currentKline.low.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">收盘</p>
              <p className="text-sm text-white">${currentKline.close.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handlePrevious}
          disabled={currentPeriodIndex <= 0 || isPlaying}
          className={`flex-1 py-2 rounded font-medium transition-colors ${
            currentPeriodIndex <= 0 || isPlaying
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gray-700 text-white hover:bg-gray-600'
          }`}
        >
          ◀◀ 后退
        </button>

        <button
          onClick={handlePlayPause}
          disabled={totalPeriods === 0}
          className={`flex-1 py-2 rounded font-medium transition-colors ${
            totalPeriods === 0
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : isPlaying
              ? 'bg-yellow-600 text-white hover:bg-yellow-700'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {isPlaying ? '暂停' : '播放'}
        </button>

        <button
          onClick={handleNext}
          disabled={currentPeriodIndex >= totalPeriods - 1 || isPlaying}
          className={`flex-1 py-2 rounded font-medium transition-colors ${
            currentPeriodIndex >= totalPeriods - 1 || isPlaying
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gray-700 text-white hover:bg-gray-600'
          }`}
        >
          前进 ▶▶
        </button>

        <button
          onClick={handleReplay}
          disabled={totalPeriods === 0}
          className={`flex-1 py-2 rounded font-medium transition-colors ${
            totalPeriods === 0
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gray-700 text-white hover:bg-gray-600'
          }`}
        >
          重播
        </button>
      </div>

      {/* Speed Control */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-xs text-gray-400">播放速度：</span>
        <div className="flex gap-1">
          {SPEED_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setPlaybackSpeed(option.value)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                playbackSpeed === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
