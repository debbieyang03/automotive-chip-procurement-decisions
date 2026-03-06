# 數據記錄功能 - 使用指南

## 完整安裝清單 ✓

您的系統已配備以下功能：

### 已實裝功能
- [x] **Supabase 數據庫集成**
  - 自動保存所有輸入參數
  - 自動保存所有輸出結果
  - 自動記錄時間戳

- [x] **配置管理**
  - 頁面上提供 Supabase 配置界面
  - 本地儲存配置（瀏覽器 localStorage）
  - 一鍵連接測試

- [x] **數據記錄追蹤**
  - 決策輸入數據
  - Pareto 方案列表
  - 選定方案詳情
  - 風險熱點分析
  - AI 採購建議

- [x] **錯誤處理**
  - 連接失敗時不中斷應用
  - 控制台錯誤日誌
  - 用戶友好的狀態提示

## 快速開始步驟

### 步驟 1：設置 Supabase 項目（5 分鐘）

```
1. 訪問 https://supabase.com
2. 點擊「Start your project」
3. 使用 Google/GitHub 登入
4. 創建新 Project：
   - 名稱：「automotive-procurement」（或自選）
   - 地區：選擇離您最近的區域
   - Database Password：自行設置強密碼
5. 等待部署完成
```

### 步驟 2：獲取 API 憑證（2 分鐘）

```
1. Project 部署後，進入 Settings → API
2. 找到並複製：
   - URL（Project URL）
   - anon public（Anon Key）
3. 保存在安全位置
```

### 步驟 3：配置應用（1 分鐘）

```
1. 打開 index.html
2. 向下滾動到「數據庫配置」區塊
3. 貼入：
   ☐ Supabase URL
   ☐ Anon Key
4. 點擊「連接數據庫」按鈕
5. 看到綠色 ✓ 標記表示成功
```

## 使用工作流程

### 常規使用

```
1. 調整參數
   ├─ 產業情境
   ├─ 製程節點
   ├─ 年需求量
   ├─ 代工廠參數（A、B、C）
   ├─ 決策偏好
   └─ 風險情境

2. 執行模擬
   └─ 點擊「執行模擬」按鈕

3. 自動數據保存
   ├─ 輸入參數 → 數據庫 ✓
   ├─ Pareto 方案 → 數據庫 ✓
   ├─ 選定方案 → 數據庫 ✓
   └─ 風險分析 → 數據庫 ✓

4. 切換方案
   ├─ 點選 Pareto 表中的其他方案
   ├─ 自動更新圖表與風險分析
   └─ 新的選擇自動保存 ✓
```

## 數據庫記錄內容清單

每次執行模擬時，以下數據被記錄：

### 🔧 輸入數據
```
□ 產業情境          → industry
□ 製程節點          → node
□ 年需求量          → demand_quantity
□ 允許急單          → expedite_allowed
□ 代工廠A成本       → cost_a
□ 代工廠A交期       → lead_a
□ 代工廠A產能       → cap_a
□ 代工廠A碳排(最小) → co2_a_min
□ 代工廠A碳排(最大) → co2_a_max
□ 代工廠B參數       → cost_b ... co2_b_max
□ 代工廠C參數       → cost_c ... co2_c_max
□ 成本權重          → weight_cost
□ 交期權重          → weight_lead
□ 碳排權重          → weight_co2
□ 選定的風險情境    → scenario_flags
```

### 📊 輸出數據
```
□ Pareto方案數量    → pareto_count
□ 選定方案編號      → selected_solution_index
□ 採購配置-A        → solution_alloc_a
□ 採購配置-B        → solution_alloc_b
□ 採購配置-C        → solution_alloc_c
□ 成本績效值        → solution_cost
□ 交期績效值        → solution_lead
□ 碳排績效值        → solution_co2
□ 加權綜合分數      → weighted_score
□ 方案標籤          → solution_label
□ 風險熱點信息      → risk_hotspots (JSON)
□ 採購建議          → recommendation_text
□ 記錄時間          → created_at
```

## 驗證數據保存

### 方法 1：查看瀏覽器控制台日誌

```
1. 按 F12 打開開發者工具
2. 進入 Console 標籤
3. 執行模擬後應看到：
   ✓ "✓ 決策輸入已保存到數據庫"
   ✓ "✓ 選定方案已保存到數據庫"
```

### 方法 2：Supabase Dashboard 實時檢查

```
1. 訪問 https://app.supabase.com
2. 進入 Project
3. 左側菜單 → SQL Editor
4. 執行查詢：
   SELECT COUNT(*) FROM decision_logs;
   
5. 或查看最新記錄：
   SELECT * FROM decision_logs 
   ORDER BY created_at DESC LIMIT 1;
```

### 方法 3：導出數據進行分析

```
在 Supabase Dashboard：
1. decision_logs 表 → 右上角 ... 菜單
2. 選擇 Export → CSV / JSON
3. 下載數據用於 Excel、Python 等工具分析
```

## 常見問題排查

### Q: 連接按鈕點擊後沒反應
A: 檢查：
   - 開發者工具（F12）→ Network 標籤
   - 確認 URL 和 Key 無誤（沒有多餘空格）
   - Supabase 帳號是否有效

### Q: 顯示連接成功，但數據未保存
A: 檢查：
   - 確認表已創建：`decision_logs`
   - 表的 RLS 策略是否允許匿名寫入
   - 瀏覽器控制台是否有錯誤信息

### Q: 如何更改已保存的配置
A: 方法：
   - 直接在「數據庫配置」區塊修改
   - 重新點擊「連接數據庫」
   - 或清除瀏覽器 localStorage（開發者工具 → Application → Clear Site Data）

## 數據分析示例

### 分析 1：比較不同成本權重下的選擇

```sql
SELECT 
  weight_cost,
  COUNT(*) as decisions,
  AVG(solution_cost) as avg_selected_cost,
  AVG(weighted_score) as avg_score
FROM decision_logs
GROUP BY weight_cost
ORDER BY weight_cost;
```

### 分析 2：風險情境對方案數量的影響

```sql
SELECT 
  scenario_flags,
  COUNT(*) as simulations,
  AVG(pareto_count) as avg_solutions,
  AVG(solution_cost) as avg_cost
FROM decision_logs
GROUP BY scenario_flags;
```

### 分析 3：最受歡迎的方案類型

```sql
SELECT 
  solution_label,
  COUNT(*) as frequency,
  ROUND(AVG(solution_cost)::numeric, 2) as avg_cost,
  ROUND(AVG(solution_lead)::numeric, 2) as avg_lead,
  ROUND(AVG(solution_co2)::numeric, 2) as avg_co2
FROM decision_logs
WHERE solution_label IS NOT NULL
GROUP BY solution_label
ORDER BY frequency DESC;
```

## 生產環境建議

### 1. 安全性
```
☐ 不要在代碼中硬編碼 API Key
☐ 使用環境變量（.env 文件）
☐ 為 decision_logs 表配置 RLS 策略
☐ 定期輪換 Supabase API Key
```

### 2. 備份策略
```
☐ 啟用 Supabase 自動備份
☐ 定期導出數據備份
☐ 保留歷史版本日誌
```

### 3. 監控與告警
```
☐ 定期檢查數據庫連接狀態
☐ 監控插入失敗率
☐ 設置 Supabase 告警規則
```

## 文件清單

```
c:\Users\user\Desktop\論文2\
├── index.html                 # 主頁面（已更新，含數據庫配置）
├── app.js                     # 應用邏輯（已更新，含數據保存函數）
├── styles.css                 # 樣式表
├── supabase-config.js         # Supabase 客戶端（可選，當前內置在 app.js）
├── DATABASE_SETUP.md          # 完整設置指南
├── .env.example               # 環境變數示例
└── USAGE_GUIDE.md             # 本文件
```

## 下一步

1. ✓ 設置 Supabase 項目
2. ✓ 配置應用連接
3. ✓ 執行幾次模擬測試
4. ✓ 檢查數據是否正確保存
5. ✓ 開始數據分析和決策洞察

---

**如需幫助**，請：
- 查看 Supabase 官方文檔：https://supabase.com/docs
- 檢查瀏覽器控制台的詳細錯誤信息
- 驗證表結構和 RLS 策略配置

**最後更新**：2026 年 3 月 6 日
