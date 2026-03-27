import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBacktestStore } from '../store/backtestStore';

interface InitialCapitalInputProps {
  onSubmit: () => void;
}

export const InitialCapitalInput: React.FC<InitialCapitalInputProps> = ({
  onSubmit,
}) => {
  const { t } = useTranslation();
  const { settings, setInitialCapital } = useBacktestStore();
  const [capital, setCapital] = useState(settings.initialCapital.toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(capital);
    if (isNaN(value) || value <= 0) {
      alert(t('initialCapitalInput.invalidAmount') || '请输入有效的金额');
      return;
    }
    setInitialCapital(value);
    onSubmit();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-white mb-4">{t('initialCapitalInput.title')}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              {t('marketDataSelector.initialCapital')} (USDT)
            </label>
            <input
              type="number"
              value={capital}
              onChange={(e) => setCapital(e.target.value)}
              className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:outline-none focus:border-blue-500"
              placeholder={t('initialCapitalInput.placeholder')}
              step="any"
              min="0"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
          >
            {t('marketDataSelector.startBacktest')}
          </button>
        </form>
      </div>
    </div>
  );
};
