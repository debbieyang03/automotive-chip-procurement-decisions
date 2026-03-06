// Supabase 集成測試
// 在瀏覽器控制台中運行此代碼以測試連接和數據保存

// 測試 1：驗證 Supabase 客戶端初始化
console.log("=== 測試 1: 客戶端初始化 ===");
console.log("DB 連接狀態:", dbConnected);
console.log("Supabase URL:", supabase.url);
console.log("Supabase Key:", supabase.anonKey ? "✓ 已設置" : "✗ 未設置");

// 測試 2：驗證配置保存到本地儲存
console.log("\n=== 測試 2: 本地儲存配置 ===");
const savedUrl = localStorage.getItem("supabase_url");
const savedKey = localStorage.getItem("supabase_key");
console.log("保存的 URL:", savedUrl || "未保存");
console.log("保存的 Key:", savedKey ? "✓ 已保存" : "✗ 未保存");

// 測試 3：測試數據庫連接
async function testDatabaseConnection() {
  console.log("\n=== 測試 3: 數據庫連接 ===");
  try {
    const url = supabase.url;
    const key = supabase.anonKey;
    
    if (!url || !key) {
      console.warn("⚠ Supabase 憑證未配置");
      return;
    }

    const response = await fetch(`${url}/rest/v1/decision_logs?limit=1`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${key}`,
        apikey: key,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✓ 數據庫連接成功");
      console.log("現有記錄數:", data.length || 0);
    } else {
      const error = await response.json();
      console.error("✗ 連接失敗:", error);
    }
  } catch (error) {
    console.error("✗ 測試異常:", error.message);
  }
}

// 測試 4：模擬數據保存
async function testDataSave() {
  console.log("\n=== 測試 4: 數據保存模擬 ===");
  
  const testData = {
    industry: "車用電子（Tier-1 / 系統廠）",
    node: "28nm",
    demand_quantity: 1000000,
    expedite_allowed: true,
    cost_a: 1.0,
    lead_a: 0.6,
    cap_a: 0.6,
    co2_a_min: 0.8,
    co2_a_max: 1.0,
    cost_b: 1.4,
    lead_b: 1.0,
    cap_b: 0.6,
    co2_b_min: 0.6,
    co2_b_max: 0.8,
    cost_c: 2.0,
    lead_c: 1.2,
    cap_c: 0.6,
    co2_c_min: 0.4,
    co2_c_max: 0.6,
    weight_cost: 2,
    weight_lead: 2,
    weight_co2: 2,
    scenario_flags: ["demand_up"],
    pareto_count: 25,
  };

  console.log("測試數據:", testData);
  
  if (!dbConnected) {
    console.warn("⚠ 數據庫未連接，跳過保存");
    return;
  }

  try {
    const result = await supabase.insert("decision_logs", testData);
    console.log("✓ 測試數據保存成功", result);
  } catch (error) {
    console.error("✗ 數據保存失敗:", error);
  }
}

// 執行所有測試
console.log("\n╔═══════════════════════════════════════════════╗");
console.log("║  Supabase 集成測試開始                         ║");
console.log("╚═══════════════════════════════════════════════╝\n");

testDatabaseConnection();
setTimeout(() => testDataSave(), 1000);

console.log("\n✓ 測試完成，請檢查上述輸出");
console.log("\n建議：");
console.log("1. 如果看到 '✓ 數據庫連接成功'，說明配置正確");
console.log("2. 如果看到 '✗ 連接失敗'，請檢查 URL 和 Key");
console.log("3. 如果看到 '✓ 測試數據保存成功'，表示可以正常記錄數據");
