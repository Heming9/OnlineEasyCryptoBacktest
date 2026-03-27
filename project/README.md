# 加密市场回测平台

> 一个纯前端的加密货币交易策略回测分析工具，支持移动端和网页端响应式设计

## 项目概述和目的

### 项目简介
本项目是一个功能完整的加密货币市场回测平台，完全运行在浏览器中，无需后端服务器。它提供了从市场数据获取、策略配置、回测执行到结果分析的完整工作流。

### 主要功能
- ✅ 实时市场数据获取（支持 OKX 交易所）
- ✅ 灵活的策略配置系统
- ✅ 高性能 K线图可视化（Lightweight Charts）
- ✅ 逐周期回测播放控制
- ✅ 详细的账户状态和成交记录
- ✅ 策略本地持久化存储
- ✅ 响应式设计，支持移动端和网页端
- ✅ 渐进式数据加载和本地缓存

### 技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.2.0 | 前端框架 |
| TypeScript | 5.0.2 | 类型安全 |
| Vite | 4.4.5 | 构建工具 |
| Zustand | 5.0.12 | 状态管理 |
| Tailwind CSS | 3.4.19 | 样式框架 |
| Lightweight Charts | 5.1.0 | K线图可视化 |
| Dexie.js | 4.3.0 | IndexedDB 本地缓存 |
| Day.js | 1.11.20 | 日期处理 |

---

## 安装说明

### 前置要求
- Node.js >= 16.0.0
- npm 或 yarn 或 pnpm
- 现代浏览器（Chrome、Firefox、Safari、Edge 最新版本）

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd project
```

2. **安装依赖**
```bash
npm install
```

3. **启动开发服务器**
```bash
npm run dev
```

4. **构建生产版本**
```bash
npm run build
```

5. **预览生产构建**
```bash
npm run preview
```

---

## 配置指南

### 项目结构
```
project/
├── src/
│   ├── components/          # React 组件
│   │   ├── KlineChart.tsx  # K线图组件
│   │   ├── AccountStatus.tsx  # 账户状态组件
│   │   ├── MarketDataSelector.tsx  # 市场数据选择器
│   │   ├── StrategyConfigurator.tsx  # 策略配置器
│   │   ├── PlaybackControls.tsx  # 播放控制组件
│   │   └── InitialCapitalInput.tsx  # 初始资金输入
│   ├── services/            # 服务层
│   │   ├── okx.ts          # OKX API 服务
│   │   └── database.ts     # IndexedDB 缓存服务
│   ├── store/              # 状态管理
│   │   └── backtestStore.ts  # 回测状态管理
│   ├── types/              # TypeScript 类型定义
│   │   └── index.ts
│   ├── App.tsx             # 主应用组件
│   └── main.tsx            # 应用入口
├── public/                 # 静态资源
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

### 环境变量
此项目当前不需要额外的环境变量配置。

---

## 使用示例和命令参考

### 快速开始
1. 访问 `http://localhost:5173/`
2. 在左侧面板选择加密货币对（BTC-USDT、ETC-USDT）
3. 选择时间周期（1小时、1天、1周）
4. 设置回测开始时间
5. 点击"开始回测"
6. 配置初始资金
7. 设置交易策略（可选）
8. 点击播放按钮开始回测

### 命令列表
| 命令 | 描述 |
|------|------|
| `npm run dev` | 启动开发服务器（端口 5173） |
| `npm run build` | 构建生产版本到 `dist/` 目录 |
| `npm run preview` | 预览生产构建 |
| `npm run lint` | 运行 ESLint 检查代码质量 |

### 策略配置示例

#### 买入策略配置
```typescript
// 示例：当收盘价 > 50000 且持仓占比 < 50% 时，买入 1000 USDT
买入条件:
  - 收盘价 > 50000
  - 持仓占比 < 50%
买入金额: $1000
```

#### 卖出策略配置
```typescript
// 示例：当浮盈亏率 > 10% 时，卖出 50% 持仓
卖出条件:
  - 浮盈亏率 > 10
卖出比例: 50%
```

---

## API 文档

### OKX API 集成

#### 获取资产列表
```typescript
import { fetchAssets } from './services/okx';

const assets = await fetchAssets();
// 返回: Array<{ symbol: string, baseAsset: string, quoteAsset: string }>
```

#### 获取 K线数据
```typescript
import { fetchKlineData } from './services/okx';

const klineData = await fetchKlineData(
  'BTC-USDT',      // 交易对
  '1d',             // 时间周期
  startTime,        // 开始时间戳（毫秒）
  endTime           // 结束时间戳（毫秒）
);
// 返回: Array<{ time, open, high, low, close, volume }>
```

### Zustand Store 使用

#### 获取和更新状态
```typescript
import { useBacktestStore } from './store/backtestStore';

function Component() {
  const { backtestState, play, pause } = useBacktestStore();
  
  return (
    <div>
      <p>当前周期: {backtestState.currentPeriodIndex}</p>
      <button onClick={play}>播放</button>
      <button onClick={pause}>暂停</button>
    </div>
  );
}
```

---

## 贡献指南

我们欢迎所有形式的贡献！

### 开发流程
1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范
- 遵循项目中现有的代码风格
- 运行 `npm run lint` 确保代码质量
- 使用 TypeScript 进行类型安全开发
- 所有组件和函数都应有适当的注释

---

## 故障排除

### 常见问题

#### 1. 白屏或无法加载
**问题**: 页面白屏或显示错误
**解决方案**:
- 检查浏览器控制台的错误信息
- 确保网络连接正常
- 清除浏览器缓存和 LocalStorage

#### 2. 无法获取市场数据
**问题**: 点击"开始回测"后没有数据加载
**解决方案**:
- 检查 OKX API 是否可访问
- 尝试更换网络环境
- 查看浏览器 Network 标签的请求详情

#### 3. 图表显示时区不正确
**问题**: K线图上的时间与本地时间不符
**解决方案**:
- 此问题已在最新版本中修复
- 确保使用最新代码
- 刷新页面重新加载

#### 4. 策略保存后刷新丢失
**问题**: 刷新页面后策略配置重置
**解决方案**:
- 此问题已在最新版本中修复
- 策略现在自动保存到 LocalStorage
- 确保浏览器支持 LocalStorage

---

## 许可证信息

本项目仅供学习研究使用。

### 数据来源
- 市场数据来自 [OKX 交易所](https://www.okx.com/)
- 本项目与 OKX 无关联关系

### 免责声明
- 本项目仅供学习和研究目的使用
- 不构成任何投资建议
- 使用本项目进行交易的风险由用户自行承担
- 请遵守您所在地区的相关法律法规

---

## 其他资源

### 相关文档
- [React 官方文档](https://react.dev/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)
- [Zustand 文档](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Lightweight Charts 文档](https://tradingview.github.io/lightweight-charts/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [OKX API 文档](https://www.okx.com/docs-v5/zh/)

### 更新日志
查看项目的 Git 提交历史以了解详细的功能更新和 Bug 修复。

---

## 联系方式

如有问题或建议，请通过以下方式联系：
- 提交 Issue 到项目仓库
- 发送邮件至项目维护者

---

**感谢您使用加密市场回测平台！** 🚀
