# 🚀 快速入門指南（5 分鐘）

## 目標
將您的採購決策系統連接到 Supabase 數據庫，自動記錄每次模擬的所有數據。

---

## ⏱️ 第 1 步：創建 Supabase 項目（3 分鐘）

### 1.1 訪問 Supabase

打開瀏覽器，進入 → **https://supabase.com**

### 1.2 登入或註冊

- 使用 Google 或 GitHub 快速登入
- 或創建新帳戶

### 1.3 創建新項目

點擊 **「New Project」** 或 **「新建項目」**

填入信息：
```
Project Name:      automotive-procurement（或自選）
Database Password: 設置強密碼（8 字符以上）
Region:           選擇最接近的地區
```

### 1.4 等待部署

系統會自動建立數據庫，通常 1-2 分鐘完成。

✓ 看到 「Project is ready」 表示成功

---

## 📋 第 2 步：獲取 API 憑證（1 分鐘）

### 2.1 打開 Settings

在項目頁面左側菜單，點擊 **Settings**

### 2.2 進入 API 標籤

左側菜單 → **Development** → **API**

### 2.3 複製關鍵信息

找到並複製：

```
1️⃣  Project URL
   例如：https://your-project.supabase.co

2️⃣  anon public（匿名金鑰）
   格式：eyJhbGciOiJIUzI1NiIs...
```

**⚠️ 注意：** 複製完整字符串，不要包含多餘空格

---

## 🔗 第 3 步：在應用中配置（1 分鐘）

### 3.1 打開應用頁面

打開 **index.html** 文件

### 3.2 找到配置區塊

向下滾動，找到這個卡片：

```
┌─────────────────────────────────────┐
│  數據庫配置（Supabase）            │
│  配置您的 Supabase 憑證以啟用...   │
└─────────────────────────────────────┘
```

### 3.3 填入憑證

在兩個文本框中：

```
□ Supabase URL    → 貼上您的 Project URL
□ Anon Key        → 貼上您的匿名金鑰
```

### 3.4 連接數據庫

點擊 **「連接數據庫」** 按鈕

**成功提示：**
```
✓ 數據庫已成功連接！
```

頁面頂部 topbar 的徽章也會變成綠色：
```
數據庫：已連接 ✓
```

---

## ✅ 驗證配置成功

### 檢查點 1：頁面徽章

頂部右側應顯示：
```
✓ 內部演示 Demo
✓ 數據庫：已連接 ✓  （綠色）
```

### 檢查點 2：瀏覽器日誌

1. 按 **F12** 打開開發者工具
2. 點擊 **Console** 標籤
3. 應該看到：
```
✓ Supabase 數據庫已成功連接
```

### 檢查點 3：執行測試模擬

1. 調整幾個參數（可選）
2. 點擊 **「執行模擬（產生 Pareto）」**
3. 控制台應顯示：
```
✓ 決策輸入已保存到數據庫
✓ 選定方案已保存到數據庫
```

---

## 🎯 開始使用

現在您已經配置完成！👏

### 常規工作流程

```
1. 調整參數
   ├─ 產業情境
   ├─ 製程節點
   ├─ 代工廠參數
   ├─ 決策偏好
   └─ 風險情境

2. 執行模擬
   └─ 點「執行模擬」按鈕

3. 自動保存到 Supabase ✓
   ├─ 輸入參數已保存
   ├─ Pareto 方案已保存
   ├─ 選定方案已保存
   └─ 風險分析已保存

4. 檢查結果
   └─ 查看圖表、KPI 和建議
```

### 查看保存的數據

#### 方式 A：Supabase Dashboard（推薦）

1. 打開 https://app.supabase.com
2. 選擇您的項目
3. 左側菜單 → **SQL Editor**
4. 執行：
```sql
SELECT * FROM decision_logs ORDER BY created_at DESC;
```

#### 方式 B：瀏覽器控制台（快速）

1. F12 打開開發者工具
2. Console 標籤
3. 查看 ✓ 日誌信息

#### 方式 C：導出數據（用於分析）

在 Supabase Dashboard：
1. decision_logs 表
2. 右上角 **...** 菜單
3. **Export** → **CSV** 或 **JSON**

---

## 🐛 快速故障排除

### 問題 1：連接失敗
```
❌ "✗ 無法連接到 Supabase"

解決方案：
✓ 檢查 URL 和 Key 沒有多餘空格
✓ 確認 Supabase 項目有效
✓ 重新複製一次粘貼
```

### 問題 2：配置無法保存
```
❌ 刷新頁面後需要重新輸入配置

解決方案：
✓ 檢查瀏覽器是否允許 localStorage
✓ 關閉無痕/隱私模式（不支持 localStorage）
✓ 清除瀏覽器 cache 後重試
```

### 問題 3：數據未保存
```
❌ 執行模擬但 Supabase 沒有新數據

解決方案：
✓ 確認頁面頂部顯示「已連接 ✓」
✓ F12 → Console 查看是否有 ✓ 成功日誌
✓ 檢查 Supabase decision_logs 表是否存在
```

更詳細的故障排除見 → **[USAGE_GUIDE.md](USAGE_GUIDE.md)**

---

## 📚 進階資源

| 需求 | 資源 |
|------|------|
| **詳細設置步驟** | [DATABASE_SETUP.md](DATABASE_SETUP.md) |
| **完整使用指南** | [USAGE_GUIDE.md](USAGE_GUIDE.md) |
| **實現技術細節** | [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) |
| **集成測試代碼** | [test-supabase.js](test-supabase.js) |
| **環境變數配置** | [.env.example](.env.example) |

---

## 🎉 完成！

恭喜您！您的系統現在已經：

- ✓ 連接到 Supabase 數據庫
- ✓ 自動記錄每次模擬的所有數據
- ✓ 支持數據檢查和導出分析
- ✓ 提供完整的文檔和支持

### 下一步

1. **執行幾次模擬** → 確認數據正確保存
2. **在 Supabase 中查看數據** → 驗證記錄完整性
3. **開始數據分析** → 生成決策洞察
4. **（可選）配置告警/自動化** → 進階功能

---

**有問題嗎？**

✓ 檢查瀏覽器控制台日誌（F12）
✓ 查看本指南的故障排除部分
✓ 參考 DATABASE_SETUP.md 中的完整 FAQ

---

**版本：1.0 | 最後更新：2026 年 3 月 6 日**
