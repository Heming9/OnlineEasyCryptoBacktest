# 加密市场回测平台

您可以在这尝试此DEMO https://heming9.github.io/OnlineEasyCryptoBacktest

基于历史数据的交易策略回测分析工具，支持中文和英文界面。

(如果无法获取交易市场数据，可能需要科学上网)

## 功能特性

- 📈 **K线图展示**：实时显示加密货币市场的历史价格数据
- 🎯 **策略配置**：灵活的买入/卖出条件编辑器
- 💰 **账户状态**：实时追踪权益、盈亏、持仓等关键指标
- ⏯️ **回测控制**：支持播放、暂停、快进、速度调节等功能
- 📊 **成交记录**：详细记录每笔交易信息，包含买卖次数统计
- 🌍 **国际化**：支持中文和英文界面切换

Preview: 
<img width="1212" height="718" alt="image" src="https://raw.githubusercontent.com/Heming9/OnlineEasyCryptoBacktest/refs/heads/main/Pasted%20Graphic.png" />

## 技术栈

- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Zustand** - 状态管理
- **Tailwind CSS** - 样式框架
- **Lightweight Charts** - 金融图表库
- **React i18next** - 国际化
- **Day.js** - 日期处理
- **Dexie.js** - IndexedDB 数据缓存

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

### 代码检查

```bash
npm run lint
```

## 使用说明

1. 选择市场数据（标的、时间周期、开始时间）
2. 设置初始资金
3. 配置交易策略（买入/卖出条件、交易金额）
4. 点击"开始回测"
5. 使用回测控制功能观察策略表现

## 项目结构

```
project/
├── src/
│   ├── components/       # React 组件
│   ├── store/           # Zustand 状态管理
│   ├── i18n/            # 国际化配置和翻译
│   ├── types/           # TypeScript 类型定义
│   └── App.tsx          # 主应用组件
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 许可证

仅供学习研究使用
