中文文档: https://github.com/Heming9/simple-crypto-backtest/blob/master/README-zh.md

# Crypto Market Backtesting Platform
You can try this demo in https://heming9.github.io/OnlineEasyCryptoBacktest

Trading strategy backtesting and analysis tool based on historical data, with support for Chinese and English interfaces.

## Features

- 📈 **K-line Chart Display**：Real-time display of historical price data for cryptocurrency markets
- 🎯 **Strategy Configuration**：Flexible buy/sell condition editor
- 💰 **Account Status**：Real-time tracking of key metrics like equity, P&L, and positions
- ⏯️ **Backtest Controls**：Support for play, pause, fast-forward, speed adjustment, and more
- 📊 **Trade Records**：Detailed record of each trade, including buy/sell count statistics
- 🌍 **Internationalization**：Support for Chinese and English interface switching

Preview: 
<img width="1320" height="724" alt="image" src="https://github.com/user-attachments/assets/a8600f33-34df-42d3-8886-16d46e880e95" />


## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Zustand** - State management
- **Tailwind CSS** - Styling framework
- **Lightweight Charts** - Financial charting library
- **React i18next** - Internationalization
- **Day.js** - Date handling
- **Dexie.js** - IndexedDB data caching

## Quick Start

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Lint Code

```bash
npm run lint
```

## Usage Instructions

1. Select market data (asset, time frame, start time)
2. Set initial capital
3. Configure trading strategy (buy/sell conditions, trade amount)
4. Click "Start Backtest"
5. Use backtest controls to observe strategy performance

## Project Structure

```
project/
├── src/
│   ├── components/       # React components
│   ├── store/           # Zustand state management
│   ├── i18n/            # i18n configuration and translations
│   ├── types/           # TypeScript type definitions
│   └── App.tsx          # Main app component
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## License

For learning and research purposes only
