import dotenv from "dotenv";
dotenv.config();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a number as KES currency, e.g. "KES 13,000.00" */
export const kes = (n) =>
  Number(n || 0).toLocaleString("en-KE", { style: "currency", currency: "KES" });

/** Format an ISO date string to "19 Jul 2026" */
export const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

/**
 * Derive a human-readable report title + scope line from jobParams.
 * Precedence: shopId → userId → financerId → categoryId → general.
 */
export function buildReportMeta(jobParams, sales) {
  const { shopId, userId, financerId, categoryId, startDate, endDate, financeStatus } = jobParams;

  const shopName   = sales.find((s) => s.shopname)?.shopname ?? `Shop #${shopId}`;
  const sellerName = sales.find((s) => s.sellername)?.sellername ?? `User #${userId}`;
  const financer   =
    sales.find((s) => s.financeDetails?.financer)?.financeDetails?.financer ??
    `Financer #${financerId}`;

  let reportType, subtitle;

  if (shopId)         { reportType = "Shop Sales Report";     subtitle = shopName;   }
  else if (userId)    { reportType = "Seller Sales Report";   subtitle = sellerName; }
  else if (financerId){ reportType = "Financer Sales Report"; subtitle = financer;   }
  else if (categoryId){ reportType = "Category Sales Report"; subtitle = `Category #${categoryId}`; }
  else                { reportType = "General Sales Report";  subtitle = "All Shops · All Sellers"; }

  const period    = `${fmtDate(startDate)} – ${fmtDate(endDate)}`;
  const statusTag = financeStatus ? ` · Finance: ${financeStatus.toUpperCase()}` : "";

  return { reportType, subtitle, period: period + statusTag };
}

// ─── Sub-helpers ──────────────────────────────────────────────────────────────

const financeBadge = (status) => {
  const map = {
    paid:    { bg: "#d1fae5", color: "#065f46", label: "PAID"    },
    pending: { bg: "#fef3c7", color: "#92400e", label: "PENDING" },
    overdue: { bg: "#fee2e2", color: "#991b1b", label: "OVERDUE" },
  };
  const s = (status || "paid").toLowerCase();
  const { bg, color, label } = map[s] || map.paid;
  return `<span style="background:${bg};color:${color};padding:2px 6px;border-radius:4px;font-size:8px;font-weight:700;">${label}</span>`;
};

const paymentBadge = (status) => {
  const s = (status || "").toUpperCase();
  const isPaid = s === "PAID";
  return `<span style="background:${isPaid ? "#d1fae5" : "#fef3c7"};color:${isPaid ? "#065f46" : "#92400e"};padding:2px 6px;border-radius:4px;font-size:8px;font-weight:700;">${s || "—"}</span>`;
};

const kpiColor = (pct) => {
  if (pct >= 100) return "#059669";
  if (pct >= 50)  return "#d97706";
  return "#dc2626";
};

const progressBar = (pct) => {
  const clamped = Math.min(Number(pct) || 0, 100);
  const color   = kpiColor(pct);
  return `<div style="background:#e2e8f0;border-radius:4px;height:6px;margin-top:4px;overflow:hidden;"><div style="width:${clamped}%;background:${color};height:100%;border-radius:4px;"></div></div>`;
};

// ─── Category table builder ───────────────────────────────────────────────────

function buildCategoryTable(title, accentColor, emoji, rows, showProfit, totals) {
  if (!rows || rows.length === 0) {
    return `
      <div class="section-title" style="background:${accentColor};">${emoji} ${title}</div>
      <div class="empty-section">No transactions recorded for this period.</div>`;
  }

  const profitTh = showProfit ? `<th>Profit</th>` : "";

  const tableRows = rows
    .map((s, i) => {
      const profitTd = showProfit
        ? `<td class="amount pos">${kes(s.netprofit)}</td>`
        : "";
      return `
        <tr class="${i % 2 === 0 ? "row-even" : "row-odd"}">
          <td class="col-num">${i + 1}</td>
          <td class="col-name"><strong>${s.productname ?? "—"}</strong><br>
            <span class="dim">Batch: ${s.batchNumber ?? "—"}</span></td>
          <td>${s.productmodel ?? "—"}</td>
          <td class="mono">${s.IMEI && s.IMEI !== 0 ? s.IMEI : "—"}</td>
          <td>${s.color ?? "—"}${s.storage && s.storage !== "N/A" ? " · " + s.storage : ""}</td>
          <td>${s.sellername ?? "—"}</td>
          <td class="mono">${s.customerName ?? "—"}<br>
            <span class="dim">${s.customerphonenumber && s.customerphonenumber !== "N/A" ? s.customerphonenumber : ""}</span></td>
          <td class="amount">${kes(s.soldprice)}</td>
          ${profitTd}
          <td class="amount" style="color:#7c3aed;">${kes(s.commission)}</td>
          <td>${paymentBadge(s.paymentstatus)}</td>
          <td>${financeBadge(s.financeDetails?.financeStatus)}</td>
          <td class="dim">${fmtDate(s.createdAt)}</td>
        </tr>`;
    })
    .join("");

  const fixedColspan = showProfit ? 7 : 7;

  return `
    <div class="section-title" style="background:${accentColor};">${emoji} ${title} <span style="font-weight:400;opacity:0.8;">(${rows.length} transaction${rows.length !== 1 ? "s" : ""})</span></div>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>#</th><th>Product</th><th>Model</th><th>IMEI / Serial</th>
            <th>Variant</th><th>Seller</th><th>Customer</th>
            <th>Sold Price</th>${profitTh}
            <th>Commission</th><th>Payment</th><th>Finance</th><th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
          <tr class="totals-row">
            <td colspan="${fixedColspan}">TOTALS — ${rows.length} transaction(s)</td>
            <td class="amount">${kes(totals.sales)}</td>
            ${showProfit ? `<td class="amount">${kes(totals.profit)}</td>` : ""}
            <td class="amount">${kes(totals.commission)}</td>
            <td colspan="3"></td>
          </tr>
        </tbody>
      </table>
    </div>`;
}

// ─── KPI section builder ──────────────────────────────────────────────────────

function buildKpiSection(kpi) {
  if (!kpi) return "";

  const categories = [
    { key: "smartphones", label: "Smartphones",  emoji: "📱", color: "#1e3a5f" },
    { key: "smallPhones", label: "Small Phones", emoji: "📟", color: "#0f5f8a" },
    { key: "accessories", label: "Accessories",  emoji: "🔌", color: "#6b21a8" },
    { key: "simCards",    label: "SIM Cards",    emoji: "📶", color: "#047857" },
  ];

  const cards = categories
    .map(({ key, label, emoji, color }) => {
      const data = kpi[key] || { target: 0, actual: 0, achievement: 0, achieved: false, remaining: 0 };
      const pct  = Number(data.achievement || 0).toFixed(1);
      const c    = kpiColor(data.achievement);
      return `
        <div class="kpi-achieve-card">
          <div class="kpi-achieve-head" style="color:${color};">${emoji} ${label}</div>
          <div class="kpi-achieve-row"><span>Target</span><strong>${data.target}</strong></div>
          <div class="kpi-achieve-row"><span>Sold</span><strong style="color:${c};">${data.actual}</strong></div>
          <div class="kpi-achieve-row"><span>Remaining</span><strong style="color:#dc2626;">${data.remaining}</strong></div>
          ${progressBar(data.achievement)}
          <div style="text-align:right;font-size:8px;font-weight:800;color:${c};margin-top:3px;">${pct}%</div>
          <div style="text-align:center;font-size:8px;font-weight:700;margin-top:4px;color:${data.achieved ? "#059669" : "#dc2626"};">
            ${data.achieved ? "✅ TARGET MET" : "⚠️ BELOW TARGET"}
          </div>
        </div>`;
    })
    .join("");

  const overall      = kpi.overall || { actual: 0, target: 0, achievement: 0 };
  const overallPct   = Number(overall.achievement || 0).toFixed(1);
  const overallColor = kpiColor(overall.achievement);

  return `
    <div class="section-title" style="background:#1a1a2e;">🎯 KPI Achievement Report</div>
    <div class="kpi-achieve-grid">${cards}</div>
    <div class="kpi-overall-bar">
      <span>Overall Achievement: <strong style="color:${overallColor};">${overall.actual} / ${overall.target} units (${overallPct}%)</strong></span>
      ${progressBar(overall.achievement)}
    </div>`;
}

// ─── Main HTML builder ────────────────────────────────────────────────────────

/**
 * Build the complete HTML document for PDF rendering.
 *
 * @param {object} groups        - { smartphones, smallPhones, accessories, simCards }
 * @param {object} summary       - summaryData from _getSummarySalesData
 * @param {object} salesKpi      - KPI result from getKpiAchievementReport
 * @param {object} meta          - { reportType, subtitle, period }
 * @param {string} generatedDate - Formatted date/time string
 * @param {string} userRole      - "manager" | "superuser" | "seller" | etc.
 */
export function buildHTML(groups, summary, salesKpi, meta, generatedDate, userRole) {
  const {
    totalSales                = 0,
    totalProfit               = 0,
    totalCommission           = 0,
    totalSmartphoneSales      = 0,
    totalSmallPhoneSales      = 0,
    totalAccessorySales       = 0,
    totalSimCardSales         = 0,
    totalSmartphoneProfit     = 0,
    totalSmallPhoneProfit     = 0,
    totalAccessoryProfit      = 0,
    totalSimCardProfit        = 0,
    totalSmartphoneCommission = 0,
    totalSmallPhoneCommission = 0,
    totalAccessoryCommission  = 0,
    totalSimCardCommission    = 0,
    totalSmartphoneUnitsSold  = 0,
    totalSmallPhoneUnitsSold  = 0,
    totalAccessoryUnitsSold   = 0,
    totalSimCardUnitsSold     = 0,
  } = summary || {};

  const { smartphones = [], smallPhones = [], accessories = [], simCards = [] } = groups;
  const allSales  = [...smartphones, ...smallPhones, ...accessories, ...simCards];

  const role       = (userRole || "").toLowerCase();
  const showProfit = role === "manager" || role === "superuser";

  const profitCard = showProfit
    ? `<div class="kpi-card">
         <div class="kpi-label">Total Profit</div>
         <div class="kpi-value" style="color:#059669;">${kes(totalProfit)}</div>
       </div>`
    : "";

  const smartphoneTable = buildCategoryTable("Smartphones", "#1e3a5f", "📱", smartphones, showProfit,
    { sales: totalSmartphoneSales, profit: totalSmartphoneProfit, commission: totalSmartphoneCommission });
  const smallPhoneTable = buildCategoryTable("Small Phones", "#0f5f8a", "📟", smallPhones, showProfit,
    { sales: totalSmallPhoneSales, profit: totalSmallPhoneProfit, commission: totalSmallPhoneCommission });
  const accessoryTable  = buildCategoryTable("Accessories",  "#6b21a8", "🔌", accessories, showProfit,
    { sales: totalAccessorySales,  profit: totalAccessoryProfit,  commission: totalAccessoryCommission  });
  const simCardTable    = buildCategoryTable("SIM Cards",    "#047857", "📶", simCards,    showProfit,
    { sales: totalSimCardSales,    profit: totalSimCardProfit,    commission: totalSimCardCommission    });

  const companyName = process.env.COMPANY_NAME || "SmartGiggs POS";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${meta.reportType}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Helvetica Neue", Arial, sans-serif; font-size: 9px; color: #1a1a2e; background: #fff; }

  .page-header { background: linear-gradient(135deg, #1e3a5f 0%, #0f5f8a 100%); color: #fff; padding: 18px 24px 14px; display: flex; justify-content: space-between; align-items: flex-start; }
  .brand-name    { font-size: 18px; font-weight: 800; letter-spacing: 0.5px; }
  .brand-tagline { font-size: 8px; opacity: 0.75; margin-top: 2px; }
  .report-title-block { text-align: right; }
  .report-type     { font-size: 13px; font-weight: 700; }
  .report-subtitle { font-size: 10px; opacity: 0.85; margin-top: 2px; }

  .meta-strip { background: #f0f4f8; border-bottom: 2px solid #1e3a5f; display: flex; flex-wrap: wrap; }
  .meta-item  { flex: 1; min-width: 80px; padding: 8px 14px; border-right: 1px solid #d1dbe6; }
  .meta-item:last-child { border-right: none; }
  .meta-key { font-size: 7px; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b; }
  .meta-val { font-size: 9px; font-weight: 700; color: #1e3a5f; margin-top: 2px; }

  .section-title { color: #fff; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 6px 14px; margin: 14px 0 0; }

  .kpi-row  { display: flex; gap: 8px; padding: 10px 14px; background: #f8fafc; flex-wrap: wrap; }
  .kpi-card { flex: 1; min-width: 100px; background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
  .kpi-label { font-size: 7px; text-transform: uppercase; letter-spacing: 0.7px; color: #94a3b8; }
  .kpi-value { font-size: 13px; font-weight: 800; margin-top: 3px; }
  .kpi-sub   { font-size: 7px; color: #64748b; margin-top: 2px; }

  .kpi-achieve-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; padding: 10px 14px; background: #f8fafc; }
  .kpi-achieve-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
  .kpi-achieve-head { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
  .kpi-achieve-row  { display: flex; justify-content: space-between; font-size: 8px; padding: 2px 0; border-bottom: 1px solid #f1f5f9; }
  .kpi-overall-bar  { padding: 8px 14px 14px; font-size: 8px; color: #475569; background: #f8fafc; }

  .breakdown-grid { display: grid; grid-template-columns: repeat(4, 1fr); margin: 0 14px 14px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; }
  .breakdown-col  { padding: 10px 14px; border-right: 1px solid #e2e8f0; }
  .breakdown-col:last-child { border-right: none; }
  .breakdown-head { font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px; }
  .breakdown-row  { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px solid rgba(0,0,0,.05); font-size: 8px; }
  .breakdown-row:last-child { border-bottom: none; }
  .breakdown-key  { color: #475569; }
  .breakdown-val  { font-weight: 700; }

  .table-wrapper { padding: 0 14px 14px; }
  table { width: 100%; border-collapse: collapse; font-size: 8px; }
  thead tr { background: #1e3a5f; color: #fff; }
  th { padding: 7px 6px; text-align: left; font-weight: 700; font-size: 7.5px; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; }
  td { padding: 6px 6px; vertical-align: top; border-bottom: 1px solid #e8edf2; }
  .row-even { background: #fff; }
  .row-odd  { background: #f8fafc; }
  .col-num  { width: 22px; text-align: center; color: #94a3b8; }
  .col-name { max-width: 120px; }
  .mono   { font-family: "Courier New", monospace; font-size: 7.5px; }
  .amount { text-align: right; font-weight: 700; white-space: nowrap; }
  .pos    { color: #059669; }
  .dim    { color: #94a3b8; font-size: 7.5px; }

  .totals-row td { background: #1e3a5f !important; color: #fff !important; font-weight: 800; font-size: 9px; padding: 8px 6px; border-bottom: none; }
  .empty-section  { padding: 12px 14px; font-size: 8px; color: #94a3b8; font-style: italic; background: #f8fafc; }

  .page-footer  { background: #f0f4f8; border-top: 2px solid #1e3a5f; padding: 10px 24px; display: flex; justify-content: space-between; align-items: center; margin-top: 14px; }
  .footer-left  { font-size: 7.5px; color: #475569; }
  .footer-right { font-size: 7.5px; color: #94a3b8; font-style: italic; }
  .confidential { text-align: center; font-size: 7px; color: #dc2626; font-weight: 700; letter-spacing: 1.5px; margin-top: 4px; padding-bottom: 8px; }
</style>
</head>
<body>

<!-- Page Header -->
<div class="page-header">
  <div>
    <div class="brand-name">${companyName}</div>
    <div class="brand-tagline">Official Sales Report System</div>
  </div>
  <div class="report-title-block">
    <div class="report-type">${meta.reportType}</div>
    <div class="report-subtitle">${meta.subtitle}</div>
  </div>
</div>

<!-- Meta Strip -->
<div class="meta-strip">
  <div class="meta-item"><div class="meta-key">Report Period</div><div class="meta-val">${meta.period}</div></div>
  <div class="meta-item"><div class="meta-key">Total Transactions</div><div class="meta-val">${allSales.length}</div></div>
  <div class="meta-item"><div class="meta-key">Smartphones</div><div class="meta-val">${smartphones.length}</div></div>
  <div class="meta-item"><div class="meta-key">Small Phones</div><div class="meta-val">${smallPhones.length}</div></div>
  <div class="meta-item"><div class="meta-key">Accessories</div><div class="meta-val">${accessories.length}</div></div>
  <div class="meta-item"><div class="meta-key">SIM Cards</div><div class="meta-val">${simCards.length}</div></div>
  <div class="meta-item"><div class="meta-key">Generated</div><div class="meta-val">${generatedDate}</div></div>
</div>

<!-- Summary KPIs -->
<div class="section-title" style="background:#1e3a5f;">📊 Summary</div>
<div class="kpi-row">
  <div class="kpi-card">
    <div class="kpi-label">Total Revenue</div>
    <div class="kpi-value" style="color:#1e3a5f;">${kes(totalSales)}</div>
    <div class="kpi-sub">${allSales.length} transactions</div>
  </div>
  ${profitCard}
  <div class="kpi-card">
    <div class="kpi-label">Total Commission</div>
    <div class="kpi-value" style="color:#7c3aed;">${kes(totalCommission)}</div>
  </div>
  <div class="kpi-card">
    <div class="kpi-label">Smartphones Revenue</div>
    <div class="kpi-value" style="color:#1e3a5f;">${kes(totalSmartphoneSales)}</div>
    <div class="kpi-sub">${totalSmartphoneUnitsSold} units</div>
  </div>
  <div class="kpi-card">
    <div class="kpi-label">Small Phones Revenue</div>
    <div class="kpi-value" style="color:#0f5f8a;">${kes(totalSmallPhoneSales)}</div>
    <div class="kpi-sub">${totalSmallPhoneUnitsSold} units</div>
  </div>
  <div class="kpi-card">
    <div class="kpi-label">Accessories Revenue</div>
    <div class="kpi-value" style="color:#6b21a8;">${kes(totalAccessorySales)}</div>
    <div class="kpi-sub">${totalAccessoryUnitsSold} units</div>
  </div>
  <div class="kpi-card">
    <div class="kpi-label">SIM Cards Revenue</div>
    <div class="kpi-value" style="color:#047857;">${kes(totalSimCardSales)}</div>
    <div class="kpi-sub">${totalSimCardUnitsSold} units</div>
  </div>
</div>

<!-- KPI Achievement -->
${buildKpiSection(salesKpi)}

<!-- Category Breakdown -->
<div class="section-title" style="background:#0f5f8a;">📋 Category Breakdown</div>
<div class="breakdown-grid">
  <div class="breakdown-col" style="background:#eff6ff;">
    <div class="breakdown-head" style="color:#1e40af;">📱 Smartphones</div>
    <div class="breakdown-row"><span class="breakdown-key">Revenue</span><span class="breakdown-val">${kes(totalSmartphoneSales)}</span></div>
    ${showProfit ? `<div class="breakdown-row"><span class="breakdown-key">Profit</span><span class="breakdown-val" style="color:#059669;">${kes(totalSmartphoneProfit)}</span></div>` : ""}
    <div class="breakdown-row"><span class="breakdown-key">Commission</span><span class="breakdown-val">${kes(totalSmartphoneCommission)}</span></div>
    <div class="breakdown-row"><span class="breakdown-key">Units</span><span class="breakdown-val">${totalSmartphoneUnitsSold}</span></div>
  </div>
  <div class="breakdown-col" style="background:#f0f9ff;">
    <div class="breakdown-head" style="color:#0284c7;">📟 Small Phones</div>
    <div class="breakdown-row"><span class="breakdown-key">Revenue</span><span class="breakdown-val">${kes(totalSmallPhoneSales)}</span></div>
    ${showProfit ? `<div class="breakdown-row"><span class="breakdown-key">Profit</span><span class="breakdown-val" style="color:#059669;">${kes(totalSmallPhoneProfit)}</span></div>` : ""}
    <div class="breakdown-row"><span class="breakdown-key">Commission</span><span class="breakdown-val">${kes(totalSmallPhoneCommission)}</span></div>
    <div class="breakdown-row"><span class="breakdown-key">Units</span><span class="breakdown-val">${totalSmallPhoneUnitsSold}</span></div>
  </div>
  <div class="breakdown-col" style="background:#fdf4ff;">
    <div class="breakdown-head" style="color:#6b21a8;">🔌 Accessories</div>
    <div class="breakdown-row"><span class="breakdown-key">Revenue</span><span class="breakdown-val">${kes(totalAccessorySales)}</span></div>
    ${showProfit ? `<div class="breakdown-row"><span class="breakdown-key">Profit</span><span class="breakdown-val" style="color:#059669;">${kes(totalAccessoryProfit)}</span></div>` : ""}
    <div class="breakdown-row"><span class="breakdown-key">Commission</span><span class="breakdown-val">${kes(totalAccessoryCommission)}</span></div>
    <div class="breakdown-row"><span class="breakdown-key">Units</span><span class="breakdown-val">${totalAccessoryUnitsSold}</span></div>
  </div>
  <div class="breakdown-col" style="background:#f0fdf4;">
    <div class="breakdown-head" style="color:#047857;">📶 SIM Cards</div>
    <div class="breakdown-row"><span class="breakdown-key">Revenue</span><span class="breakdown-val">${kes(totalSimCardSales)}</span></div>
    ${showProfit ? `<div class="breakdown-row"><span class="breakdown-key">Profit</span><span class="breakdown-val" style="color:#059669;">${kes(totalSimCardProfit)}</span></div>` : ""}
    <div class="breakdown-row"><span class="breakdown-key">Commission</span><span class="breakdown-val">${kes(totalSimCardCommission)}</span></div>
    <div class="breakdown-row"><span class="breakdown-key">Units</span><span class="breakdown-val">${totalSimCardUnitsSold}</span></div>
  </div>
</div>

<!-- Grouped Transaction Tables -->
<div class="section-title" style="background:#1a1a2e;">📝 Detailed Sales Transactions</div>
${smartphoneTable}
${smallPhoneTable}
${accessoryTable}
${simCardTable}

<!-- Footer -->
<div class="page-footer">
  <div class="footer-left">
    ${companyName} · Official Sales Report<br>
    Generated by ${companyName} · ${generatedDate}
  </div>
  <div class="footer-right">This document is system-generated and requires no physical signature.</div>
</div>
<div class="confidential">CONFIDENTIAL — FOR INTERNAL USE ONLY</div>

</body>
</html>`;
}
