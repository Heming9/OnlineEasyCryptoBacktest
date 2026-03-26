import { useState } from 'react';
import { useBacktestStore } from '../store/backtestStore';

interface InitialCapitalInputProps {
  onSubmit: () => void;
}

export const InitialCapitalInput: React.FC<InitialCapitalInputProps> = ({
  onSubmit,
}) => {
  const { settings, setInitialCapital } = useBacktestStore();
  const [capital, setCapital] = useState(settings.initialCapital.toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(capital);
    if (isNaN(value) || value <= 0) {
      alert('请输入有效的金额');
      return;
    }
    setInitialCapital(value);
    onSubmit();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-white mb-4">设置初始资金</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              初始资金 (USDT)
            </label>
            <input
              type="number"
              value={capital}
              onChange={(e) => setCapital(e.target.value)}
              className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:outline-none focus:border-blue-500"
              placeholder="10000"
              step="any"
              min="0"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
          >
            开始回测
          </button>
        </form>
      </div>
    </div>
  );
};
