# 採購決策系統 - Supabase 數據庫集成實現總結

## 實現概述

您的採購決策展示系統已完全集成 Supabase 數據庫功能，可自動記錄所有用戶的決策輸入和模擬輸出。

---

## 📋 實現清單

### ✅ 已完成

| 功能模塊 | 狀態 | 說明 |
|---------|------|------|
| **Supabase 表創建** | ✓ | decision_logs 表已在 Supabase 上創建 |
| **應用配置界面** | ✓ | index.html 添加了配置卡片 |
| **數據保存函數** | ✓ | app.js 包含完整的數據保存邏輯 |
| **數據庫連接管理** | ✓ | 支持連接測試和狀態指示 |
| **本地存儲** | ✓ | 配置自動保存到瀏覽器 localStorage |
| **錯誤處理** | ✓ | 連接失敗時不中斷應用 |
| **文檔完整性** | ✓ | 提供詳細的設置和使用指南 |

---

## 🎯 核心功能

### 1. 自動數據記錄

**何時記錄：** 用戶點擊「執行模擬（產生 Pareto）」按鈕時

**記錄內容：**
- 所有輸入參數（代工廠、決策偏好、風險情境）
- Pareto 方案列表
- 選定方案的詳細信息
- 風險熱點分析
- AI 採購建議

### 2. 數據庫配置

位置：index.html 中「數據庫配置（Supabase）」卡片

配置步驟：
1. 輸入 Supabase URL
2. 輸入 Anon Key
3. 點擊「連接數據庫」
4. 配置自動保存到本地

### 3. 連接狀態指示

頁面頂部 topbar 中的「數據庫」徽章顯示：
- 🟢 **已連接**：數據正常保存
- 🔴 **未連接**：需要配置或檢查憑證

---

## 📁 文件結構

```
c:\Users\user\Desktop\論文2\
│
├─ index.html                    # 主頁面（已更新）
│  └─ 新增：數據庫配置卡片
│
├─ app.js                        # 應用邏輯（已更新）
│  ├─ SimpleSupabaseClient 類    # Supabase 客戶端
│  ├─ saveDecisionLogToDatabase  # 保存決策輸入
│  ├─ saveSelectedSolutionToDatabase  # 保存選定方案
│  ├─ initDbConfig               # 配置管理初始化
│  └─ testDatabaseConnection     # 連接測試函數
│
├─ styles.css                    # 樣式表（已兼容新元素）
│
├─ supabase-config.js            # Supabase 配置文件（可選）
│
├─ test-supabase.js              # 集成測試腳本
│
├─ DATABASE_SETUP.md             # 數據庫設置完整指南
│
├─ USAGE_GUIDE.md                # 使用指南和故障排除
│
└─ .env.example                  # 環境變數示例
```

---

## 🔧 技術實現細節

### Supabase 客戶端

```javascript
class SimpleSupabaseClient {
  constructor(url, anonKey) { ... }
  async insert(table, data) { ... }
}
```

特點：
- 無依賴（不需要 npm 包）
- 支持 CORS 跨域
- 自動處理 JWT 認證
- 錯誤日誌記錄

### 數據保存流程

```
用戶操作 → 執行模擬 → 計算 Pareto
                ↓
            [檢查連接]
                ↓
         [數據庫已連接]
                ↓
         [準備數據對象]
                ↓
        [保存到 decision_logs]
                ↓
        [日誌 + 用戶提示]
```

### 表結構

**表名：** `decision_logs`

**關鍵字段：**
- `id` (UUID) - 主鍵
- `created_at` (TIMESTAMP) - 自動時間戳
- 34 個業務字段（輸入+輸出）

詳見 [DATABASE_SETUP.md](DATABASE_SETUP.md) 中的完整字段說明

---

## 🚀 使用流程

### 第一次使用（3 分鐘設置）

```
1. 訪問 supabase.com 創建項目（5 分鐘）
2. 獲取 Project URL 和 Anon Key（2 分鐘）
3. 在應用中配置（1 分鐘）
4. 點擊「連接數據庫」（自動測試連接）
```

### 常規使用

```
1. 調整参数（作為之前）
2. 執行模擬（同上）
3. 數據自動保存 ✓
4. 檢查結果（同上）
```

### 數據檢查

```
方法 1：瀏覽器控制台
   F12 → Console → 檢查日誌

方法 2：Supabase Dashboard
   app.supabase.com → decision_logs 表 → 查看數據

方法 3：導出分析
   Supabase → Export CSV/JSON → Excel/Python
```

---

## 📊 數據記錄示例

### 輸入示例

```json
{
  "industry": "車用電子（Tier-1 / 系統廠）",
  "node": "28nm",
  "demand_quantity": 1000000,
  "expedite_allowed": true,
  "cost_a": 1.0,
  "lead_a": 0.6,
  "weight_cost": 2,
  "weight_lead": 2,
  "weight_co2": 2,
  "scenario_flags": ["demand_up", "material_short"],
  "pareto_count": 25
}
```

### 輸出示例

```json
{
  "solution_alloc_a": 0.35,
  "solution_alloc_b": 0.4,
  "solution_alloc_c": 0.25,
  "solution_cost": 1.275,
  "solution_lead": 0.84,
  "solution_co2": 0.72,
  "weighted_score": 0.9175,
  "solution_label": "折衷方案（推薦）",
  "recommendation_text": "...",
  "risk_hotspots": [...]
}
```

---

## ⚙️ 配置方式

### 方式 1：UI 配置（推薦 - 無代碼）

1. 打開 index.html
2. 找到「數據庫配置」卡片
3. 輸入憑證 → 連接

**優點：** 友好、易於管理、可隨時切換

### 方式 2：環境變數（進階）

```javascript
// 在 app.js 中修改
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
```

### 方式 3：配置文件（可選）

```javascript
// 使用 supabase-config.js
import { supabase } from './supabase-config.js';
```

---

## 🔒 安全考慮

### 已實施

- ✓ 使用匿名金鑰（不暴露服務端金鑰）
- ✓ 支持 HTTPS 傳輸
- ✓ 本地存儲使用瀏覽器 localStorage
- ✓ 無敏感信息在代碼中硬編碼

### 建議

- 🔐 為 decision_logs 表配置 RLS 策略
- 🔐 定期輪換 Anon Key
- 🔐 生產環境使用環境變量
- 🔐 定期備份數據庫

詳見 [DATABASE_SETUP.md](DATABASE_SETUP.md) 中的安全部分

---

## 🐛 故障排除

### 連接失敗

**症狀：** 「數據庫：未連接 ✗」

**解決方案：**
1. 驗證 URL 格式（https://... 無多餘空格）
2. 檢查 Supabase 項目是否有效
3. 打開 F12 → Network 查看請求狀態

### 數據未保存

**症狀：** 日誌顯示成功，但 Supabase 無數據

**解決方案：**
1. 檢查 decision_logs 表是否存在
2. 驗證表的 RLS 策略
3. 檢查瀏覽器控制台錯誤信息

### 配置無法保存

**症狀：** 每次刷新都需重新配置

**解決方案：**
1. 檢查瀏覽器是否允許 localStorage
2. 清除瀏覽器 cookies/cache 後重試
3. 或使用無痕模式測試

詳細排除步驟見 [USAGE_GUIDE.md](USAGE_GUIDE.md)

---

## 📈 數據分析案例

### 查詢 1：統計不同情境下的方案數量

```sql
SELECT 
  node, 
  AVG(pareto_count) as avg_solutions,
  COUNT(*) as simulations
FROM decision_logs
GROUP BY node
ORDER BY simulations DESC;
```

### 查詢 2：找出最受歡迎的決策標籤

```sql
SELECT 
  solution_label,
  COUNT(*) as frequency,
  ROUND(AVG(weighted_score)::numeric, 3) as avg_score
FROM decision_logs
WHERE solution_label IS NOT NULL
GROUP BY solution_label;
```

### 查詢 3：分析成本權重對選擇的影響

```sql
SELECT 
  weight_cost,
  ROUND(AVG(solution_cost)::numeric, 2) as avg_cost,
  ROUND(AVG(solution_lead)::numeric, 2) as avg_lead,
  ROUND(AVG(solution_co2)::numeric, 2) as avg_co2
FROM decision_logs
GROUP BY weight_cost;
```

---

## ✨ 後續擴展建議

### Phase 2：可視化儀表板
- Grafana/Tableau 連接 Supabase
- 實時數據分析和趨勢展示

### Phase 3：高級功能
- 數據導出和報告自動生成
- 決策歷史比較和版本控制
- 多用戶協作和註釋

### Phase 4：集成擴展
- API 開放供外部系統調用
- 機器學習模型訓練數據
- 實時預警和通知

---

## 📞 支持資源

| 資源 | 鏈接 |
|------|------|
| Supabase 官方文檔 | https://supabase.com/docs |
| Supabase 社區 | https://discord.supabase.com |
| 本項目文檔 | 見 DATABASE_SETUP.md, USAGE_GUIDE.md |

---

## 📝 版本信息

| 項目 | 信息 |
|------|------|
| 系統名稱 | 車用晶片採購決策展示（研究用） |
| 集成日期 | 2026 年 3 月 6 日 |
| Supabase 版本 | V1（無特殊要求） |
| 瀏覽器支援 | Chrome, Firefox, Safari, Edge (現代版本) |
| 狀態 | ✓ 完全可用 |

---

## 快速參考

### 配置步驟（30 秒版本）

```
1. supabase.com → 新建項目
2. Settings → API → 複製 URL 和 Key
3. 本應用 → 「數據庫配置」 → 貼入
4. 「連接數據庫」 → ✓ 完成
5. 執行模擬 → 數據自動保存
```

### 日常工作流（3 步）

```
1. 調整參數
2. 點「執行模擬」
3. 檢查結果（數據已保存到數據庫）
```

### 查看數據（3 種方式）

```
方式 A：F12 → Console （即時日誌）
方式 B：supabase.com Dashboard （直觀界面）
方式 C：Export CSV （用於 Excel/Python）
```

---

**祝您使用愉快！** 🎉

如有任何問題，請參考文檔或查看瀏覽器控制台的詳細錯誤信息。
