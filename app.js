const $ = (id) => document.getElementById(id);

const canvas = $("allocChart");
const ctx = canvas ? canvas.getContext("2d") : null;

const COLORS = {
  A: "#6aa8ff",
  B: "#46e6a6",
  C: "#ffcc66",
};

// Supabase 配置
const SUPABASE_URL = 'https://ittjbzdhhmhpdfzzhezp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_sfnqHutjYQ4Rb2zeHj_HEw_KAuexw0v';

// 簡單的 Supabase 客戶端實現
class SimpleSupabaseClient {
  constructor(url, anonKey) {
    this.url = url;
    this.anonKey = anonKey;
  }

  async insert(table, data) {
    try {
      const response = await fetch(`${this.url}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.anonKey}`,
          'apikey': this.anonKey,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Supabase insert error:', error);
        throw error;
      }

      return { success: true, status: response.status };
    } catch (error) {
      console.error('Failed to save to database:', error);
      // 顯示警告但不中斷應用
      console.warn('Note: 數據未成功保存到數據庫，請檢查Supabase配置');
      return { success: false, error };
    }
  }
}

const supabase = new SimpleSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== 數據庫配置管理 ==========
let dbConnected = false;

function updateDbStatus(connected, message = '') {
  dbConnected = connected;
  const badge = $("dbStatus");
  if (badge) {
    if (connected) {
      badge.style.background = "#46e6a6";
      badge.textContent = "數據庫：已連接 ✓";
      badge.title = message || "Supabase 數據庫已連接";
    } else {
      badge.style.background = "#ff9999";
      badge.textContent = "數據庫：未連接 ✗";
      badge.title = message || "請配置 Supabase 憑證";
    }
  }
}

function loadDbConfig() {
  let savedUrl = localStorage.getItem("supabase_url");
  let savedKey = localStorage.getItem("supabase_key");

  // 如果沒有保存的憑證，使用預設值
  if (!savedUrl || !savedKey) {
    savedUrl = SUPABASE_URL;
    savedKey = SUPABASE_ANON_KEY;
    localStorage.setItem("supabase_url", savedUrl);
    localStorage.setItem("supabase_key", savedKey);
  }

  const urlEl = $("supabaseUrl");
  const keyEl = $("supabaseKey");

  if (urlEl) urlEl.value = savedUrl;
  if (keyEl) keyEl.value = savedKey;

  // 嘗試與憑證連接
  testDatabaseConnection(savedUrl, savedKey);
}

async function testDatabaseConnection(url, key) {
  try {
    // 創建臨時客戶端以測試連接
    const testClient = new SimpleSupabaseClient(url, key);
    const result = await fetch(`${url}/rest/v1/decision_logs?limit=1`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${key}`,
        apikey: key,
      },
    });

    if (result.ok) {
      // 更新全局客戶端
      supabase.url = url;
      supabase.anonKey = key;

      updateDbStatus(true, "✓ Supabase 數據庫已成功連接");
      return true;
    } else {
      updateDbStatus(false, "✗ 無法連接到 Supabase - 請檢查憑證");
      return false;
    }
  } catch (error) {
    console.error("Database connection test failed:", error);
    updateDbStatus(false, "✗ 連接失敗：" + error.message);
    return false;
  }
}

function initDbConfig() {
  const connectBtn = $("connectDbBtn");
  const statusBtn = $("showDbStatusBtn");

  if (connectBtn) {
    connectBtn.addEventListener("click", async () => {
      const url = $("supabaseUrl")?.value || "";
      const key = $("supabaseKey")?.value || "";

      if (!url || !key) {
        alert("請輸入 Supabase URL 和 Anon Key");
        return;
      }

      const success = await testDatabaseConnection(url, key);
      if (success) {
        localStorage.setItem("supabase_url", url);
        localStorage.setItem("supabase_key", key);
        alert("✓ 數據庫已成功連接！");
      }
    });
  }

  if (statusBtn) {
    statusBtn.addEventListener("click", () => {
      if (dbConnected) {
        alert("✓ 數據庫已連接\nURL: " + (supabase.url || "未配置"));
      } else {
        alert("✗ 數據庫未連接\n請先配置 Supabase 憑證並點擊「連接數據庫」");
      }
    });
  }

  // 初始化時載入保存的配置
  loadDbConfig();
}

const DEFAULT_PARAMS = {
  A: { cost: 1.0, lead: 0.6, co2_min: 0.8, co2_max: 1.0, cap: 0.60, label: "代工廠 A" },
  B: { cost: 1.4, lead: 1.0, co2_min: 0.6, co2_max: 0.8, cap: 0.60, label: "代工廠 B" },
  C: { cost: 2.0, lead: 1.2, co2_min: 0.4, co2_max: 0.6, cap: 0.60, label: "代工廠 C" },
};

let STATE = {
  pareto: [],
  selectedIndex: 0,
  lastParams: null,
  lastWeights: null,
  lastFlags: null,
};

function readNumber(id, fallback) {
  const el = $(id);
  if (!el) return fallback;
  const v = Number(el.value);
  return Number.isFinite(v) ? v : fallback;
}

function clamp(x, lo, hi) {
  return Math.max(lo, Math.min(hi, x));
}

function normalizeWeights(wCost, wLead, wCO2) {
  const sum = wCost + wLead + wCO2;
  if (sum <= 0) return { cost: 1 / 3, lead: 1 / 3, co2: 1 / 3 };
  return {
    cost: wCost / sum,
    lead: wLead / sum,
    co2: wCO2 / sum,
  };
}

function getScenarioFlags() {
  return Array.from(document.querySelectorAll(".scenario:checked")).map((x) => x.value);
}

function formatIndex(x) {
  return (Math.round(x * 100) / 100).toFixed(2);
}

/* 滑桿同步 */
function syncCO2Slider(prefix) {
  const minEl = $(`co2${prefix}_min`);
  const maxEl = $(`co2${prefix}_max`);
  const minValEl = $(`co2${prefix}_min_val`);
  const maxValEl = $(`co2${prefix}_max_val`);
  const avgEl = $(`co2${prefix}_avg`);

  if (!minEl || !maxEl) return;

  let minVal = Number(minEl.value);
  let maxVal = Number(maxEl.value);

  if (minVal > maxVal) {
    if (document.activeElement === minEl) {
      maxVal = minVal;
      maxEl.value = maxVal;
    } else {
      minVal = maxVal;
      minEl.value = minVal;
    }
  }

  const avg = (minVal + maxVal) / 2;

  if (minValEl) minValEl.textContent = formatIndex(minVal);
  if (maxValEl) maxValEl.textContent = formatIndex(maxVal);
  if (avgEl) avgEl.textContent = formatIndex(avg);
}

function initCO2Sliders() {
  ["A", "B", "C"].forEach((prefix) => {
    const minEl = $(`co2${prefix}_min`);
    const maxEl = $(`co2${prefix}_max`);

    if (minEl) {
      minEl.addEventListener("input", () => syncCO2Slider(prefix));
    }
    if (maxEl) {
      maxEl.addEventListener("input", () => syncCO2Slider(prefix));
    }

    syncCO2Slider(prefix);
  });
}

function getFoundryParams() {
  const A_min = readNumber("co2A_min", DEFAULT_PARAMS.A.co2_min);
  const A_max = readNumber("co2A_max", DEFAULT_PARAMS.A.co2_max);

  const B_min = readNumber("co2B_min", DEFAULT_PARAMS.B.co2_min);
  const B_max = readNumber("co2B_max", DEFAULT_PARAMS.B.co2_max);

  const C_min = readNumber("co2C_min", DEFAULT_PARAMS.C.co2_min);
  const C_max = readNumber("co2C_max", DEFAULT_PARAMS.C.co2_max);

  const A = {
    cost: readNumber("costA", DEFAULT_PARAMS.A.cost),
    lead: readNumber("leadA", DEFAULT_PARAMS.A.lead),
    co2_min: Math.min(A_min, A_max),
    co2_max: Math.max(A_min, A_max),
    co2: (Math.min(A_min, A_max) + Math.max(A_min, A_max)) / 2,
    cap: clamp(readNumber("capA", DEFAULT_PARAMS.A.cap * 100) / 100, 0, 1),
    label: DEFAULT_PARAMS.A.label,
  };

  const B = {
    cost: readNumber("costB", DEFAULT_PARAMS.B.cost),
    lead: readNumber("leadB", DEFAULT_PARAMS.B.lead),
    co2_min: Math.min(B_min, B_max),
    co2_max: Math.max(B_min, B_max),
    co2: (Math.min(B_min, B_max) + Math.max(B_min, B_max)) / 2,
    cap: clamp(readNumber("capB", DEFAULT_PARAMS.B.cap * 100) / 100, 0, 1),
    label: DEFAULT_PARAMS.B.label,
  };

  const C = {
    cost: readNumber("costC", DEFAULT_PARAMS.C.cost),
    lead: readNumber("leadC", DEFAULT_PARAMS.C.lead),
    co2_min: Math.min(C_min, C_max),
    co2_max: Math.max(C_min, C_max),
    co2: (Math.min(C_min, C_max) + Math.max(C_min, C_max)) / 2,
    cap: clamp(readNumber("capC", DEFAULT_PARAMS.C.cap * 100) / 100, 0, 1),
    label: DEFAULT_PARAMS.C.label,
  };

  if (A.cap + B.cap + C.cap <= 0) {
    A.cap = DEFAULT_PARAMS.A.cap;
    B.cap = DEFAULT_PARAMS.B.cap;
    C.cap = DEFAULT_PARAMS.C.cap;
  }

  return { A, B, C };
}

function generateAllocationsGrid(params, step = 0.1) {
  const sols = [];
  const N = Math.round(1 / step);

  for (let ai = 0; ai <= N; ai++) {
    const a = ai / N;
    if (a > params.A.cap + 1e-9) continue;

    for (let bi = 0; bi <= N - ai; bi++) {
      const b = bi / N;
      const c = 1 - a - b;

      if (b > params.B.cap + 1e-9) continue;
      if (c > params.C.cap + 1e-9) continue;

      sols.push({
        A: a,
        B: b,
        C: Math.max(0, c),
      });
    }
  }

  return sols;
}

function evaluateSolution(alloc, params, expediteAllowed) {
  let cost = 0;
  let lead = 0;
  let co2 = 0;

  for (const f of ["A", "B", "C"]) {
    cost += alloc[f] * params[f].cost;
    lead += alloc[f] * params[f].lead;
    co2 += alloc[f] * params[f].co2;
  }

  if (expediteAllowed === "no") {
    lead *= 1.05;
  }

  return {
    ...alloc,
    cost,
    lead,
    co2,
  };
}

function dominates(b, a) {
  const noWorse = b.cost <= a.cost && b.lead <= a.lead && b.co2 <= a.co2;
  const strictlyBetter = b.cost < a.cost || b.lead < a.lead || b.co2 < a.co2;
  return noWorse && strictlyBetter;
}

function paretoFilter(solutions) {
  const validSolutions = solutions.filter(s => 
    Number.isFinite(s.cost) && Number.isFinite(s.lead) && Number.isFinite(s.co2) &&
    Number.isFinite(s.A) && Number.isFinite(s.B) && Number.isFinite(s.C)
  );
  return validSolutions.filter((s) => !validSolutions.some((o) => dominates(o, s)));
}

function scoreByWeights(sol, weights) {
  return weights.cost * sol.cost + weights.lead * sol.lead + weights.co2 * sol.co2;
}

function drawAllocationChart(alloc, params) {
  if (!ctx || !canvas) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.globalAlpha = 0.12;
  for (let y = 20; y < canvas.height; y += 24) {
    ctx.beginPath();
    ctx.moveTo(10, y);
    ctx.lineTo(canvas.width - 10, y);
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
  }
  ctx.restore();

  const cx = 140;
  const cy = 120;
  const r = 78;
  let start = -Math.PI / 2;

  for (const f of ["A", "B", "C"]) {
    const share = alloc[f] || 0;
    const end = start + share * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle = COLORS[f] || "#999";
    ctx.fill();
    start = end;
  }

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "bold 14px system-ui, -apple-system, Segoe UI, Roboto, Noto Sans TC";
  ctx.fillText("採購比例", 20, 28);

  const bx = 260;
  const by = 62;
  const bw = 140;
  const bh = 16;
  const gap = 16;
  let i = 0;

  for (const f of ["A", "B", "C"]) {
    const share = alloc[f] || 0;
    const y = by + i * (bh + gap);

    ctx.fillStyle = "rgba(255,255,255,0.10)";
    ctx.fillRect(bx, y, bw, bh);

    ctx.fillStyle = COLORS[f] || "#999";
    ctx.fillRect(bx, y, Math.max(6, bw * share), bh);

    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Noto Sans TC";
    ctx.fillText(`${f} ${Math.round(share * 100)}%`, bx, y - 4);

    i++;
  }

  const legend = $("allocLegend");
  if (legend) {
    legend.innerHTML = "";
    for (const f of ["A", "B", "C"]) {
      const item = document.createElement("div");
      item.innerHTML = `<span class="dot" style="background:${COLORS[f] || "#999"}"></span>${params[f].label}`;
      legend.appendChild(item);
    }
  }
}

function leadRiskLevel(leadValue) {
  if (leadValue <= 0.8) return "低";
  if (leadValue <= 1.05) return "中";
  return "高";
}

function setKPI(sol) {
  $("kpiCost").textContent = formatIndex(sol.cost);
  $("kpiCostSub").textContent = "越低代表相對成本越佳";

  const lr = leadRiskLevel(sol.lead);
  $("kpiLead").textContent = lr;
  $("kpiLeadSub").textContent = `交期風險指標：${formatIndex(sol.lead)}（越低越穩）`;

  $("kpiCO2").textContent = formatIndex(sol.co2);
  $("kpiCO2Sub").textContent = "越低代表相對碳排強度越佳";
}

function pickSolutionLabel(weights) {
  const top = Math.max(weights.cost, weights.lead, weights.co2);
  if (top === weights.cost && weights.cost > 0.45) return "偏低成本方案";
  if (top === weights.lead && weights.lead > 0.45) return "偏交期穩健方案";
  if (top === weights.co2 && weights.co2 > 0.45) return "偏低碳方案";
  return "折衷方案（推薦）";
}

function riskLevelTag(level) {
  if (level === "高") return `<span class="riskTag risk-high">高</span>`;
  if (level === "中") return `<span class="riskTag risk-mid">中</span>`;
  return `<span class="riskTag risk-low">低</span>`;
}

function computeRiskHotspots(alloc, scenarioFlags) {
  const shares = Object.values(alloc);
  const maxShare = Math.max(...shares);
  const herfindahl = shares.reduce((s, p) => s + p * p, 0);
  const flags = new Set(scenarioFlags);

  let waferScore = 30 + herfindahl * 50;
  let pkgScore = 25;
  let testScore = 20;

  const reasons = {
    wafer: [],
    pkg: [],
    test: [],
  };

  if (maxShare > 0.65) {
    waferScore += 12;
    reasons.wafer.push("採購過度集中於單一來源");
  } else {
    reasons.wafer.push("採購來源相對分散");
  }

  if (flags.has("demand_up")) {
    waferScore += 12;
    testScore += 10;
    reasons.wafer.push("需求上升 → 產能緊度提高");
    reasons.test.push("需求上升 → 測試/交付壓力上升");
  }

  if (flags.has("region_limit")) {
    waferScore += 14;
    reasons.wafer.push("地區受限情境 → 供應中斷風險上升");
  }

  if (flags.has("material_short")) {
    pkgScore += 28;
    reasons.pkg.push("材料短缺情境 → 封裝材料成瓶頸機率上升");
  } else {
    reasons.pkg.push("未啟用材料短缺情境");
  }

  if (flags.has("low_carbon_strict")) {
    waferScore += 6;
    pkgScore += 6;
    reasons.wafer.push("低碳限制加嚴 → 可選組合受限");
    reasons.pkg.push("低碳限制加嚴 → 替代彈性降低");
  }

  waferScore = clamp(waferScore, 0, 100);
  pkgScore = clamp(pkgScore, 0, 100);
  testScore = clamp(testScore, 0, 100);

  function toLevel(score) {
    if (score >= 65) return "高";
    if (score >= 45) return "中";
    return "低";
  }

  const rows = [
    {
      name: "晶圓代工（成熟製程）",
      level: toLevel(waferScore),
      reason: reasons.wafer.join("；"),
    },
    {
      name: "封裝材料（示意：基板/樹脂/ABF）",
      level: toLevel(pkgScore),
      reason: reasons.pkg.join("；"),
    },
    {
      name: "測試 / 交付產能",
      level: toLevel(testScore),
      reason: reasons.test.length ? reasons.test.join("；") : "一般情境下風險較低",
    },
  ];

  const order = { 高: 3, 中: 2, 低: 1 };
  rows.sort((a, b) => order[b.level] - order[a.level]);

  return { rows, meta: { maxShare, herfindahl } };
}

function updateRiskTable(riskRows) {
  const tbody = $("riskTable");
  if (!tbody) return;

  tbody.innerHTML = "";
  for (const r of riskRows) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.name}</td>
      <td>${riskLevelTag(r.level)}</td>
      <td>${r.reason}</td>
    `;
    tbody.appendChild(tr);
  }
}

function buildRecommendation(solutionLabel, alloc, riskRows, weights) {
  const sortedShares = Object.entries(alloc).sort((a, b) => b[1] - a[1]);
  const shareText = sortedShares.map(([f, s]) => `${f} ${Math.round(s * 100)}%`).join("、");
  const topRisk = riskRows[0];
  const recommendations = [];
  const maxShare = sortedShares[0][1];

  if (maxShare >= 0.6) {
    recommendations.push("建議降低對單一代工廠的依賴，適度提高多來源採購比例，以分散供應集中風險。");
  } else {
    recommendations.push("目前採購配置已具一定分散度，可持續維持多來源策略以提升供應韌性。");
  }

  if (topRisk.name.includes("晶圓代工")) {
    recommendations.push("建議優先關注晶圓代工產能配置，並評估是否建立備援代工來源，以降低上游瓶頸風險。");
  }

  if (topRisk.name.includes("封裝材料")) {
    recommendations.push("建議提前檢視封裝材料與基板供應狀況，必要時建立安全庫存或第二供應來源。");
  }

  if (topRisk.name.includes("測試")) {
    recommendations.push("建議同步檢查測試與交付產能，避免上游採購配置完成後，下游交付能力不足。");
  }

  if (weights.co2 > weights.cost && weights.co2 > weights.lead) {
    recommendations.push("由於目前決策偏好偏向低碳，建議逐步提高低碳供應商比例，但仍需留意成本上升與交期穩定性。");
  }

  if (weights.cost > weights.lead && weights.cost > weights.co2) {
    recommendations.push("由於目前偏向成本導向，建議同步監控交期與供應風險，避免低成本策略導致缺料風險升高。");
  }

  if (weights.lead > weights.cost && weights.lead > weights.co2) {
    recommendations.push("由於目前偏向交期穩定導向，建議優先保留高可靠供應來源，即使成本略高仍較符合策略目標。");
  }

  return `
目前選定方案為「${solutionLabel}」
採購配置為 ${shareText}

主要風險熱點為「${topRisk.name}」（風險等級：${topRisk.level}）

AI 採購策略建議：
• ${recommendations.join("\n• ")}
`.trim();
}

function renderParetoTable(paretoList, weights) {
  const tbody = $("paretoTableBody");
  const count = $("paretoCount");

  if (count) count.textContent = paretoList.length ? `${paretoList.length} 個` : "0 個";
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!paretoList.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="8" class="muted">找不到可行方案（請檢查 cap 是否過小）</td>`;
    tbody.appendChild(tr);
    return;
  }

  const sorted = [...paretoList].sort((a, b) => scoreByWeights(a, weights) - scoreByWeights(b, weights));

  sorted.forEach((sol, idx) => {
    const s = scoreByWeights(sol, weights);
    const tr = document.createElement("tr");
    tr.style.cursor = "pointer";

    if (idx === STATE.selectedIndex) {
      tr.style.outline = "2px solid rgba(106,168,255,0.55)";
      tr.style.borderRadius = "12px";
    }

    tr.innerHTML = `
      <td>S${idx + 1}</td>
      <td>${Math.round(sol.A * 100)}%</td>
      <td>${Math.round(sol.B * 100)}%</td>
      <td>${Math.round(sol.C * 100)}%</td>
      <td>${formatIndex(sol.cost)}</td>
      <td>${formatIndex(sol.lead)}</td>
      <td>${formatIndex(sol.co2)}</td>
      <td>${formatIndex(s)}</td>
    `;

    tr.addEventListener("click", () => {
      STATE.selectedIndex = idx;
      renderParetoTable(sorted, weights);
      applySelectedSolution(sorted[idx]);
    });

    tbody.appendChild(tr);
  });

  STATE.pareto = sorted;
}

function applySelectedSolution(sol) {
  const weights = STATE.lastWeights || normalizeWeights(2, 2, 2);
  const label = pickSolutionLabel(weights);

  if ($("solutionLabel")) {
    $("solutionLabel").textContent = label;
  }

  drawAllocationChart({ A: sol.A, B: sol.B, C: sol.C }, STATE.lastParams || DEFAULT_PARAMS);
  setKPI(sol);

  const flags = STATE.lastFlags || [];
  const risk = computeRiskHotspots({ A: sol.A, B: sol.B, C: sol.C }, flags);
  updateRiskTable(risk.rows);

  if ($("insightText")) {
    $("insightText").textContent = buildRecommendation(label, { A: sol.A, B: sol.B, C: sol.C }, risk.rows, weights);
  }

  // 保存選定方案到數據庫
  saveSelectedSolutionToDatabase(
    sol,
    label,
    STATE.lastParams,
    STATE.lastWeights,
    STATE.lastFlags,
    risk.rows,
    buildRecommendation(label, { A: sol.A, B: sol.B, C: sol.C }, risk.rows, weights)
  );
}

function runPareto() {
  const params = getFoundryParams();
  const wCost = Number($("w_cost")?.value ?? 2);
  const wLead = Number($("w_lead")?.value ?? 2);
  const wCO2 = Number($("w_co2")?.value ?? 2);

  const weights = normalizeWeights(wCost, wLead, wCO2);
  const expediteAllowed = $("expedite")?.value ?? "yes";
  const flags = getScenarioFlags();

  STATE.lastParams = params;
  STATE.lastWeights = weights;
  STATE.lastFlags = flags;

  const step = 0.1;
  const candidates = generateAllocationsGrid(params, step).map((a) =>
    evaluateSolution(a, params, expediteAllowed)
  );

  const pareto = paretoFilter(candidates);

  STATE.selectedIndex = 0;
  renderParetoTable(pareto, weights);

  if (STATE.pareto.length) {
    applySelectedSolution(STATE.pareto[0]);
  }
}

// ========== 數據庫保存函數 ==========
async function saveDecisionLogToDatabase(params, weights, expediteAllowed, flags, paretoList) {
  if (!dbConnected) {
    console.warn("Database not connected - skipping save");
    return;
  }

  try {
    const logData = {
      // 基本假設
      industry: $("industry")?.value || "車用電子（Tier-1 / 系統廠）",
      node: $("node")?.value || "28nm",
      demand_quantity: parseInt($("demand")?.value || 1000000),
      expedite_allowed: expediteAllowed === "yes",

      // 代工廠參數 A
      cost_a: parseFloat(params.A.cost),
      lead_a: parseFloat(params.A.lead),
      cap_a: parseFloat(params.A.cap),
      co2_a_min: parseFloat(params.A.co2_min),
      co2_a_max: parseFloat(params.A.co2_max),

      // 代工廠參數 B
      cost_b: parseFloat(params.B.cost),
      lead_b: parseFloat(params.B.lead),
      cap_b: parseFloat(params.B.cap),
      co2_b_min: parseFloat(params.B.co2_min),
      co2_b_max: parseFloat(params.B.co2_max),

      // 代工廠參數 C
      cost_c: parseFloat(params.C.cost),
      lead_c: parseFloat(params.C.lead),
      cap_c: parseFloat(params.C.cap),
      co2_c_min: parseFloat(params.C.co2_min),
      co2_c_max: parseFloat(params.C.co2_max),

      // 決策偏好
      weight_cost: Number($("w_cost")?.value || 2),
      weight_lead: Number($("w_lead")?.value || 2),
      weight_co2: Number($("w_co2")?.value || 2),
      scenario_flags: flags || [],

      // Pareto結果
      pareto_count: paretoList.length,
    };

    console.log("Saving decision log:", logData);
    await supabase.insert("decision_logs", logData);
    console.log("✓ 決策輸入已保存到數據庫");
  } catch (error) {
    console.error("Failed to save decision log:", error);
  }
}

async function saveSelectedSolutionToDatabase(
  solution,
  label,
  params,
  weights,
  flags,
  riskRows,
  recommendation
) {
  if (!dbConnected) {
    console.warn("Database not connected - skipping save");
    return;
  }

  // 檢查 solution 是否有無效值
  if (!solution || !Number.isFinite(solution.A) || !Number.isFinite(solution.B) || !Number.isFinite(solution.C) ||
      !Number.isFinite(solution.cost) || !Number.isFinite(solution.lead) || !Number.isFinite(solution.co2)) {
    console.warn("Invalid solution data - skipping save:", solution);
    return;
  }

  try {
    const w = weights || normalizeWeights(2, 2, 2);
    const wCost = Number($("w_cost")?.value || 2);
    const wLead = Number($("w_lead")?.value || 2);
    const wCO2 = Number($("w_co2")?.value || 2);

    const updateData = {
      // 基本假設
      industry: $("industry")?.value || "車用電子（Tier-1 / 系統廠）",
      node: $("node")?.value || "28nm",
      demand_quantity: parseInt($("demand")?.value || 1000000),
      expedite_allowed: $("expedite")?.value === "yes",

      // 代工廠參數 A
      cost_a: parseFloat(params?.A?.cost || 1.0),
      lead_a: parseFloat(params?.A?.lead || 0.6),
      cap_a: parseFloat(params?.A?.cap || 0.6),
      co2_a_min: parseFloat(params?.A?.co2_min || 0.8),
      co2_a_max: parseFloat(params?.A?.co2_max || 1.0),

      // 代工廠參數 B
      cost_b: parseFloat(params?.B?.cost || 1.4),
      lead_b: parseFloat(params?.B?.lead || 1.0),
      cap_b: parseFloat(params?.B?.cap || 0.6),
      co2_b_min: parseFloat(params?.B?.co2_min || 0.6),
      co2_b_max: parseFloat(params?.B?.co2_max || 0.8),

      // 代工廠參數 C
      cost_c: parseFloat(params?.C?.cost || 2.0),
      lead_c: parseFloat(params?.C?.lead || 1.2),
      cap_c: parseFloat(params?.C?.cap || 0.6),
      co2_c_min: parseFloat(params?.C?.co2_min || 0.4),
      co2_c_max: parseFloat(params?.C?.co2_max || 0.6),

      // 決策偏好
      weight_cost: wCost,
      weight_lead: wLead,
      weight_co2: wCO2,
      scenario_flags: flags || [],

      // Pareto結果
      pareto_count: STATE.pareto?.length || 0,
      selected_solution_index: STATE.selectedIndex,

      // 選定方案的採購配置
      solution_alloc_a: parseFloat(solution.A.toFixed(3)),
      solution_alloc_b: parseFloat(solution.B.toFixed(3)),
      solution_alloc_c: parseFloat(solution.C.toFixed(3)),

      // 選定方案的績效指標
      solution_cost: parseFloat(solution.cost.toFixed(2)),
      solution_lead: parseFloat(solution.lead.toFixed(2)),
      solution_co2: parseFloat(solution.co2.toFixed(2)),
      weighted_score: parseFloat(
        (w.cost * solution.cost + w.lead * solution.lead + w.co2 * solution.co2).toFixed(4)
      ),
      solution_label: label,

      // 風險熱點與建議
      risk_hotspots: riskRows,
      recommendation_text: recommendation,
    };

    console.log("Updating solution data:", updateData);
    
    await supabase.insert("decision_logs", updateData);
    console.log("✓ 選定方案已保存到數據庫");
  } catch (error) {
    console.error("Failed to save selected solution:", error);
  }
}

// ========== 事件處理 ==========
function resetAll() {
  if ($("w_cost")) $("w_cost").value = "2";
  if ($("w_lead")) $("w_lead").value = "2";
  if ($("w_co2")) $("w_co2").value = "2";
  if ($("expedite")) $("expedite").value = "yes";

  document.querySelectorAll(".scenario").forEach((ch) => (ch.checked = false));

  if ($("costA")) $("costA").value = DEFAULT_PARAMS.A.cost;
  if ($("leadA")) $("leadA").value = DEFAULT_PARAMS.A.lead;
  if ($("capA")) $("capA").value = Math.round(DEFAULT_PARAMS.A.cap * 100);
  if ($("co2A_min")) $("co2A_min").value = DEFAULT_PARAMS.A.co2_min;
  if ($("co2A_max")) $("co2A_max").value = DEFAULT_PARAMS.A.co2_max;

  if ($("costB")) $("costB").value = DEFAULT_PARAMS.B.cost;
  if ($("leadB")) $("leadB").value = DEFAULT_PARAMS.B.lead;
  if ($("capB")) $("capB").value = Math.round(DEFAULT_PARAMS.B.cap * 100);
  if ($("co2B_min")) $("co2B_min").value = DEFAULT_PARAMS.B.co2_min;
  if ($("co2B_max")) $("co2B_max").value = DEFAULT_PARAMS.B.co2_max;

  if ($("costC")) $("costC").value = DEFAULT_PARAMS.C.cost;
  if ($("leadC")) $("leadC").value = DEFAULT_PARAMS.C.lead;
  if ($("capC")) $("capC").value = Math.round(DEFAULT_PARAMS.C.cap * 100);
  if ($("co2C_min")) $("co2C_min").value = DEFAULT_PARAMS.C.co2_min;
  if ($("co2C_max")) $("co2C_max").value = DEFAULT_PARAMS.C.co2_max;

  ["A", "B", "C"].forEach(syncCO2Slider);

  if ($("solutionLabel")) $("solutionLabel").textContent = "折衷方案（推薦）";
  if ($("kpiCost")) $("kpiCost").textContent = "—";
  if ($("kpiLead")) $("kpiLead").textContent = "—";
  if ($("kpiCO2")) $("kpiCO2").textContent = "—";
  if ($("kpiCostSub")) $("kpiCostSub").textContent = "—";
  if ($("kpiLeadSub")) $("kpiLeadSub").textContent = "—";
  if ($("kpiCO2Sub")) $("kpiCO2Sub").textContent = "—";

  const riskBody = $("riskTable");
  if (riskBody) riskBody.innerHTML = `<tr><td colspan="3" class="muted">請先執行模擬</td></tr>`;

  const paretoBody = $("paretoTableBody");
  if (paretoBody) paretoBody.innerHTML = `<tr><td colspan="8" class="muted">請先執行模擬</td></tr>`;

  if ($("paretoCount")) $("paretoCount").textContent = "—";
  if ($("insightText")) $("insightText").textContent = "—";

  if (ctx && canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  STATE = {
    pareto: [],
    selectedIndex: 0,
    lastParams: null,
    lastWeights: null,
    lastFlags: null,
  };
}

$("runBtn")?.addEventListener("click", runPareto);
$("resetBtn")?.addEventListener("click", resetAll);

initCO2Sliders();
initDbConfig();
resetAll();