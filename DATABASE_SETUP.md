# 採購決策系統 - Supabase 數據庫集成指南

## 概述

此系統已整合 Supabase 數據庫功能，自動記錄所有採購決策的輸入參數和輸出結果。

## 功能

每次執行模擬時，系統會自動保存以下數據：

### 📥 輸入數據
- **基本假設**：產業情境、製程節點、年需求量、是否允許急單
- **代工廠參數**（A、B、C）：成本、交期風險、產能上限、碳排強度範圍
- **決策偏好**：成本、交期、碳排重要性權重
- **供應衝擊情境**：選定的風險場景

### 📤 輸出數據
- **Pareto 方案數量**：生成的可行方案個數
- **選定方案**：
  - 採購配置比例（A、B、C 的百分比）
  - 三個目標的績效值（成本、交期、碳排）
  - 加權綜合分數
  - 方案標籤（低成本/交期穩健/低碳等）
- **風險熱點分析**：
  - 晶圓代工、封裝材料、測試交付的風險等級
  - 風險原因說明
- **AI 採購建議**：自動生成的策略建議文本
- **時間戳**：記錄的創建時間

## 快速開始

### 第 1 步：獲取 Supabase 憑證

1. 訪問 [https://app.supabase.com](https://app.supabase.com)
2. 登入或創建新帳戶
3. 新建一個 Project（如果還沒有）
4. 進入 **Settings** → **API**
5. 複製：
   - **Project URL**（例如：`https://your-project.supabase.co`）
   - **anon public** Key（`sb_anon_...` 或完整的匿名金鑰）

### 第 2 步：配置數據庫連接

1. 打開應用頁面
2. 在頁面頂部找到 **「數據庫配置」** 卡片
3. 填入：
   - **Supabase URL**：貼上您的 Project URL
   - **Anon Key**：貼上您的匿名金鑰
4. 點擊 **「連接數據庫」** 按鈕
5. 看到 ✓ 提示表示連接成功

配置會自動保存在瀏覽器的本地儲存中，下次訪問時無需重新配置。

### 第 3 步：開始使用

1. 調整輸入參數（代工廠參數、決策偏好、風險情境）
2. 點擊 **「執行模擬（產生 Pareto）」** 按鈕
3. 系統將自動：
   - 生成 Pareto 可行方案
   - 將輸入和輸出數據保存到 Supabase 數據庫
   - 顯示結果

## 數據庫架構

所有數據存儲在 `decision_logs` 表中，字段說明：

| 字段名 | 類型 | 說明 |
|--------|------|------|
| `id` | UUID | 記錄 ID |
| `created_at` | TIMESTAMP | 記錄創建時間 |
| `industry` | TEXT | 產業情境 |
| `node` | TEXT | 製程節點 |
| `demand_quantity` | INTEGER | 年需求量（顆） |
| `expedite_allowed` | BOOLEAN | 是否允許急單 |
| `cost_a/b/c` | DECIMAL | 代工廠成本指標 |
| `lead_a/b/c` | DECIMAL | 代工廠交期風險 |
| `cap_a/b/c` | DECIMAL | 代工廠產能上限 |
| `co2_a_min/max` 等 | DECIMAL | 碳排強度範圍 |
| `weight_cost/lead/co2` | INTEGER | 決策權重 |
| `scenario_flags` | TEXT[] | 選定的風險情境 |
| `pareto_count` | INTEGER | Pareto 方案數量 |
| `solution_alloc_a/b/c` | DECIMAL | 選定方案的採購配置 |
| `solution_cost/lead/co2` | DECIMAL | 選定方案的績效值 |
| `weighted_score` | DECIMAL | 加權綜合分數 |
| `solution_label` | TEXT | 方案標籤 |
| `risk_hotspots` | JSONB | 風險熱點詳細信息 |
| `recommendation_text` | TEXT | AI 採購建議 |

## 查看保存的數據

### 方式 1：Supabase Dashboard

1. 訪問 [https://app.supabase.com](https://app.supabase.com)
2. 選擇您的 Project
3. 左側菜單 → **SQL Editor**
4. 執行查詢：
   ```sql
   SELECT * FROM decision_logs ORDER BY created_at DESC LIMIT 20;
   ```

### 方式 2：使用 Supabase CLI

```bash
# 安裝 Supabase CLI
npm install -g supabase

# 連接您的 Project
supabase login

# 查詢數據
supabase db pull
```

### 方式 3：導出為 CSV

在 Supabase Dashboard 中：
1. 進入 **decision_logs** 表
2. 點擊右上角的 **...** 菜單
3. 選擇 **Export** → **CSV**

## 故障排除

### 連接失敗

**症狀**：頁面顯示「數據庫：未連接 ✗」

**解決方案**：
1. 確認 Supabase URL 和 Key 無誤
2. 檢查是否複製了完整的字符串（避免空格）
3. 確認瀏覽器允許 CORS 跨域請求
4. 檢查 Supabase 帳號是否有效

### 數據未保存

**症狀**：執行模擬後，數據庫中沒有新記錄

**解決方案**：
1. 檢查連接狀態（點擊頂部「查看連接狀態」按鈕）
2. 打開瀏覽器開發者工具（F12）→ **Console** 查看錯誤信息
3. 確認 Supabase 的表已正確創建
4. 檢查表的 RLS（Row Level Security）設置是否允許匿名插入

### 權限錯誤

如果看到「 Policy violation」或類似錯誤，需要配置表的 RLS 策略：

1. 在 Supabase Dashboard 進入 **decision_logs** 表
2. 點擊 **RLS** 標籤
3. 創建新策略允許 `INSERT`：
   ```sql
   CREATE POLICY "Allow anonymous inserts" ON decision_logs
   FOR INSERT WITH CHECK (true);
   ```

## 數據隱私與安全

- 本應用使用匿名金鑰（不暴露敏感金鑰）
- 建議為 `decision_logs` 表設置 RLS 策略，限制數據訪問
- 生產環境請使用環境變量管理敏感信息
- 定期備份您的 Supabase 數據

## 高級用法

### 分析累積數據

示例 SQL 查詢：

```sql
-- 統計不同情境下的平均成本
SELECT 
  industry, 
  node,
  AVG(solution_cost) as avg_cost,
  COUNT(*) as count
FROM decision_logs
GROUP BY industry, node
ORDER BY avg_cost DESC;

-- 找出最受歡迎的方案類型
SELECT 
  solution_label,
  COUNT(*) as frequency,
  AVG(weighted_score) as avg_score
FROM decision_logs
WHERE solution_label IS NOT NULL
GROUP BY solution_label;

-- 風險分析
SELECT 
  scenario_flags,
  AVG(pareto_count) as avg_solutions
FROM decision_logs
WHERE scenario_flags IS NOT NULL
GROUP BY scenario_flags;
```

### 與其他工具集成

您可以使用 Supabase 的 API 與以下工具集成：
- **Tableau/Power BI**：直接連接 Supabase 進行可視化
- **Python/R**：使用 `supabase-py` 或 REST API 進行數據分析
- **Zapier**：建立自動化工作流程

## 聯繫與支持

如有問題，請：
1. 檢查 [Supabase 官方文檔](https://supabase.com/docs)
2. 查看瀏覽器控制台錯誤信息
3. 驗證數據庫配置和表結構

---

**更新時間**：2026 年 3 月
**版本**：1.0
