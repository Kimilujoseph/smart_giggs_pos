import { parentPort, workerData } from "worker_threads";
import { salesmanagment } from "../services/sales-services.js";
import puppeteer from "puppeteer";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
dotenv.config();
// Each worker thread owns its Prisma instance — disconnected in finally{} to
// prevent connection-pool exhaustion across concurrent workers.
const prisma = new PrismaClient();
const salesService = new salesmanagment();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a number as KES currency, e.g. "KES 13,000.00" */
const kes = (n) =>
  Number(n || 0).toLocaleString("en-KE", { style: "currency", currency: "KES" });

/** Format an ISO date string to "19 Jul 2026" */
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

/**
 * Derive a human-readable report title + scope line from jobParams.
 * Precedence: shopId → userId → financerId → categoryId → general.
 * The actual shop/seller/financer name is taken from the first sale row
 * so we don't need an extra DB round-trip.
 */
function buildReportMeta(jobParams, sales) {
  const { shopId, userId, financerId, categoryId, startDate, endDate, financeStatus } = jobParams;

  const shopName = sales.find(s => s.shopname)?.shopname ?? `Shop #${shopId}`;
  const sellerName = sales.find(s => s.sellername)?.sellername ?? `User #${userId}`;
  const financer = sales.find(s => s.financeDetails?.financer)?.financeDetails?.financer ?? `Financer #${financerId}`;

  let reportType, subtitle;

  if (shopId) {
    reportType = "Shop Sales Report";
    subtitle = shopName;
  } else if (userId) {
    reportType = "Seller Sales Report";
    subtitle = sellerName;
  } else if (financerId) {
    reportType = "Financer Sales Report";
    subtitle = financer;
  } else if (categoryId) {
    reportType = "Category Sales Report";
    subtitle = `Category #${categoryId}`;
  } else {
    reportType = "General Sales Report";
    subtitle = "All Shops · All Sellers";
  }

  const period = `${fmtDate(startDate)} – ${fmtDate(endDate)}`;
  const statusTag = financeStatus ? ` · Finance: ${financeStatus.toUpperCase()}` : "";

  return { reportType, subtitle, period: period + statusTag };
}

// ─── HTML builder ─────────────────────────────────────────────────────────────

function buildHTML(sales, summary, meta, generatedDate) {
  const {
    totalSales = 0, totalProfit = 0, totalCommission = 0,
    totalMobileSales = 0, totalAccessorySales = 0,
    totalMobileProfit = 0, totalAccessoryProfit = 0,
    totalMobileCommission = 0, totalAccessoryCommission = 0,
  } = summary;

  const mobileSales = sales.filter(s => s.category === "mobiles");
  const accessorySales = sales.filter(s => s.category === "accessories");

  // ── Finance badge colours ─────────────────────────────────────────────────
  const financeBadge = (status) => {
    const map = {
      paid: { bg: "#d1fae5", color: "#065f46", label: "PAID" },
      pending: { bg: "#fef3c7", color: "#92400e", label: "PENDING" },
      overdue: { bg: "#fee2e2", color: "#991b1b", label: "OVERDUE" },
    };
    const s = (status || "paid").toLowerCase();
    const { bg, color, label } = map[s] || map.paid;
    return `<span style="background:${bg};color:${color};padding:2px 6px;border-radius:4px;font-size:8px;font-weight:700;">${label}</span>`;
  };

  // ── Category badge ────────────────────────────────────────────────────────
  const categoryBadge = (cat) => {
    const isMobile = (cat || "").toLowerCase() === "mobiles";
    return isMobile
      ? `<span style="background:#dbeafe;color:#1e40af;padding:2px 6px;border-radius:4px;font-size:8px;font-weight:700;">MOBILE</span>`
      : `<span style="background:#f3e8ff;color:#6b21a8;padding:2px 6px;border-radius:4px;font-size:8px;font-weight:700;">ACCESSORY</span>`;
  };

  // ── KPI card HTML ─────────────────────────────────────────────────────────
  const kpiCard = (label, value, accent, sub = "") => `
        <div class="kpi-card">
            <div class="kpi-label">${label}</div>
            <div class="kpi-value" style="color:${accent};">${value}</div>
            ${sub ? `<div class="kpi-sub">${sub}</div>` : ""}
        </div>`;

  // ── Section divider ───────────────────────────────────────────────────────
  const sectionTitle = (title, color = "#1e3a5f") =>
    `<div class="section-title" style="background:${color};">${title}</div>`;

  // ── Individual sale rows ──────────────────────────────────────────────────
  const rows = sales.map((s, i) => `
        <tr class="${i % 2 === 0 ? "row-even" : "row-odd"}">
            <td class="col-num">${i + 1}</td>
            <td class="col-cat">${categoryBadge(s.category)}</td>
            <td class="col-name"><strong>${s.productname ?? "—"}</strong><br>
                <span class="dim">Batch: ${s.batchNumber ?? "—"}</span></td>
            <td>${s.productmodel ?? "—"}</td>
            <td class="mono">${s.IMEI && s.IMEI !== 0 ? s.IMEI : "—"}</td>
            <td>${s.color ?? "—"} ${s.storage && s.storage !== "N/A" ? "· " + s.storage : ""}</td>
            <td>${s.sellername ?? "—"}</td>
            <td class="mono">${s.customerName ?? "—"}<br>
                <span class="dim">${s.customerphonenumber && s.customerphonenumber !== "N/A" ? s.customerphonenumber : ""}</span></td>
            <td class="amount">${kes(s.soldprice)}</td>

            <td>${financeBadge(s.financeDetails?.financeStatus)}</td>
            <td class="dim">${fmtDate(s.createdAt)}</td>
        </tr>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${meta.reportType}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: "Helvetica Neue", Arial, sans-serif;
    font-size: 9px;
    color: #1a1a2e;
    background: #fff;
    padding: 0;
  }

  /* ── Page header ─────────────────────────────────────────────────── */
  .page-header {
    background: linear-gradient(135deg, #1e3a5f 0%, #0f5f8a 100%);
    color: #fff;
    padding: 18px 24px 14px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .brand-name { font-size: 18px; font-weight: 800; letter-spacing: 0.5px; }
  .brand-tagline { font-size: 8px; opacity: 0.75; margin-top: 2px; }
  .report-title-block { text-align: right; }
  .report-type { font-size: 13px; font-weight: 700; }
  .report-subtitle { font-size: 10px; opacity: 0.85; margin-top: 2px; }

  /* ── Meta strip ──────────────────────────────────────────────────── */
  .meta-strip {
    background: #f0f4f8;
    border-bottom: 2px solid #1e3a5f;
    display: flex;
    gap: 0;
    padding: 0;
  }
  .meta-item {
    flex: 1;
    padding: 8px 14px;
    border-right: 1px solid #d1dbe6;
  }
  .meta-item:last-child { border-right: none; }
  .meta-key { font-size: 7px; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b; }
  .meta-val { font-size: 9px; font-weight: 700; color: #1e3a5f; margin-top: 2px; }

  /* ── Section title bar ───────────────────────────────────────────── */
  .section-title {
    color: #fff;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 6px 14px;
    margin: 14px 0 0;
  }

  /* ── KPI cards ───────────────────────────────────────────────────── */
  .kpi-row {
    display: flex;
    gap: 8px;
    padding: 10px 14px;
    background: #f8fafc;
    flex-wrap: wrap;
  }
  .kpi-card {
    flex: 1;
    min-width: 90px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 8px 10px;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
  }
  .kpi-label { font-size: 7px; text-transform: uppercase; letter-spacing: 0.7px; color: #94a3b8; }
  .kpi-value { font-size: 13px; font-weight: 800; margin-top: 3px; }
  .kpi-sub   { font-size: 7px; color: #64748b; margin-top: 2px; }

  /* ── Breakdown grid ──────────────────────────────────────────────── */
  .breakdown-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    margin: 0 14px 14px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    overflow: hidden;
  }
  .breakdown-col { padding: 10px 14px; }
  .breakdown-col:first-child { border-right: 1px solid #e2e8f0; background: #f0f7ff; }
  .breakdown-col:last-child  { background: #fdf4ff; }
  .breakdown-head { font-size: 8px; font-weight: 800; text-transform: uppercase;
                    letter-spacing: 0.8px; margin-bottom: 6px; }
  .breakdown-row { display: flex; justify-content: space-between;
                   padding: 3px 0; border-bottom: 1px solid rgba(0,0,0,.05); }
  .breakdown-row:last-child { border-bottom: none; }
  .breakdown-key { color: #475569; }
  .breakdown-val { font-weight: 700; }

  /* ── Sales table ─────────────────────────────────────────────────── */
  .table-wrapper { padding: 0 14px 14px; }
  table { width: 100%; border-collapse: collapse; margin-top: 0; font-size: 8px; }
  thead tr { background: #1e3a5f; color: #fff; }
  th { padding: 7px 6px; text-align: left; font-weight: 700;
       font-size: 7.5px; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; }
  td { padding: 6px 6px; vertical-align: top; border-bottom: 1px solid #e8edf2; }
  .row-even { background: #fff; }
  .row-odd  { background: #f8fafc; }
  tr:hover td { background: #eff6ff; }

  .col-num  { width: 22px; text-align: center; color: #94a3b8; }
  .col-cat  { width: 70px; }
  .col-name { max-width: 130px; }
  .mono     { font-family: "Courier New", monospace; font-size: 7.5px; }
  .amount   { text-align: right; font-weight: 700; white-space: nowrap; }
  .pos      { color: #059669; }
  .neg      { color: #dc2626; }
  .dim      { color: #94a3b8; font-size: 7.5px; }

  /* ── Totals row ──────────────────────────────────────────────────── */
  .totals-row td {
    background: #1e3a5f !important;
    color: #fff !important;
    font-weight: 800;
    font-size: 9px;
    padding: 8px 6px;
    border-bottom: none;
  }

  /* ── Footer ──────────────────────────────────────────────────────── */
  .page-footer {
    background: #f0f4f8;
    border-top: 2px solid #1e3a5f;
    padding: 10px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 14px;
  }
  .footer-left  { font-size: 7.5px; color: #475569; }
  .footer-right { font-size: 7.5px; color: #94a3b8; font-style: italic; }
  .confidential {
    text-align: center;
    font-size: 7px;
    color: #dc2626;
    font-weight: 700;
    letter-spacing: 1.5px;
    margin-top: 4px;
  }
</style>
</head>
<body>

<!-- ── Page Header ──────────────────────────────────────────────────────── -->
<div class="page-header">
  <div>
    <div class="brand-name">${process.env.COMPANY_NAME}</div>
   <!--  <div class="brand-tagline">${process.env.COMPANY_SLOGAN}</div> -->
  </div>
  <div class="report-title-block">
    <div class="report-type">${meta.reportType}</div>
    <div class="report-subtitle">${meta.subtitle}</div>
  </div>
</div>

<!-- ── Meta Strip ───────────────────────────────────────────────────────── -->
<div class="meta-strip">
  <div class="meta-item">
    <div class="meta-key">Report Period</div>
    <div class="meta-val">${meta.period}</div>
  </div>
  <div class="meta-item">
    <div class="meta-key">Total Transactions</div>
    <div class="meta-val">${sales.length}</div>
  </div>
  <div class="meta-item">
    <div class="meta-key">Mobile Transactions</div>
    <div class="meta-val">${mobileSales.length}</div>
  </div>
  <div class="meta-item">
    <div class="meta-key">Accessory Transactions</div>
    <div class="meta-val">${accessorySales.length}</div>
  </div>
  <div class="meta-item">
    <div class="meta-key">Generated</div>
    <div class="meta-val">${generatedDate}</div>
  </div>
</div>

<!-- ── Summary Section ──────────────────────────────────────────────────── -->
${sectionTitle("Summary")}
<div class="kpi-row">
  ${kpiCard("Total Revenue", kes(totalSales), "#1e3a5f")}
  ${kpiCard("Total Commission", kes(totalCommission), "#7c3aed")}
</div>

<!-- ── Mobile / Accessory Breakdown ─────────────────────────────────────── -->
${sectionTitle("Category Breakdown", "#0f5f8a")}
<div class="breakdown-grid">
  <div class="breakdown-col">
    <div class="breakdown-head" style="color:#1e40af;">📱 Mobile Sales</div>
    <div class="breakdown-row">
      <span class="breakdown-key">Revenue</span>
      <span class="breakdown-val">${kes(totalMobileSales)}</span>
    </div>
    <div class="breakdown-row">
      <span class="breakdown-key">Commission</span>
      <span class="breakdown-val">${kes(totalMobileCommission)}</span>
    </div>
    <div class="breakdown-row">
      <span class="breakdown-key">Units</span>
      <span class="breakdown-val">${mobileSales.length}</span>
    </div>
  </div>
  <div class="breakdown-col">
    <div class="breakdown-head" style="color:#6b21a8;">🔌 Accessory Sales</div>
    <div class="breakdown-row">
      <span class="breakdown-key">Revenue</span>
      <span class="breakdown-val">${kes(totalAccessorySales)}</span>
    </div>
    <div class="breakdown-row">
      <span class="breakdown-key">Commission</span>
      <span class="breakdown-val">${kes(totalAccessoryCommission)}</span>
    </div>
    <div class="breakdown-row">
      <span class="breakdown-key">Units</span>
      <span class="breakdown-val">${accessorySales.length}</span>
    </div>
  </div>
</div>

<!-- ── Sales Detail Table ────────────────────────────────────────────────── -->
${sectionTitle("Detailed Sales Transactions")}
<div class="table-wrapper">
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Category</th>
        <th>Product</th>
        <th>Model</th>
        <th>IMEI / Serial</th>
        <th>Variant</th>
        <th>Seller</th>
        <th>Customer</th>
        <th>Sold Price</th>
        <th>Finance</th>
        <th>Date</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="totals-row">
        <td colspan="8">TOTALS — ${sales.length} transaction(s)</td>
        <td class="amount">${kes(totalSales)}</td>
        <td colspan="2"></td>
      </tr>
    </tbody>
  </table>
</div>

<!-- ── Page Footer ───────────────────────────────────────────────────────── -->
<div class="page-footer">
  <div class="footer-left">
    ${process.env.COMPANY_NAME} · Official Sales Report<br>
    Generated by ${process.env.COMPANY_NAME} · ${generatedDate}
  </div>
  <div class="footer-right">
    This document is system-generated and requires no physical signature.
  </div>
</div>
<div class="confidential">CONFIDENTIAL — FOR INTERNAL USE ONLY</div>

</body>
</html>`;
}

// ─── Main worker function ──────────────────────────────────────────────────────

async function processReport() {
  const { jobParams, wsEndpoint } = workerData;
  let browser, page;

  const memoryMonitor = setInterval(() => {
    try {
      const usage = process.memoryUsage();
      if (usage.heapUsed > 1.5 * 1024 * 1024 * 1024) {
        parentPort.postMessage({ type: "MEMORY_WARNING", usage });
      }
    } catch (err) {
      console.error("[Worker] Memory monitor error:", err);
    }
  }, 5000);

  try {
    console.log("[Worker] Fetching data for job params:", jobParams);

    // All three DB fetches run in parallel
    const [summaryData, mobileSalesResult, accessorySalesResult] =
      await Promise.all([
        salesService._getSummarySalesData(jobParams),
        salesService.generategeneralsales({ ...jobParams, model: "mobiles" }),
        salesService.generategeneralsales({ ...jobParams, model: "accessory" }),
      ]);

    const mobileSalesRows = mobileSalesResult?.sales?.sales || [];
    const accessorySalesRows = accessorySalesResult?.sales?.sales || [];

    // Merge and sort newest-first
    const sales = [...mobileSalesRows, ...accessorySalesRows].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    console.log(
      `[Worker] Fetched ${sales.length} rows. ` +
      `Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(0)} MB`
    );

    const meta = buildReportMeta(jobParams, sales);
    const generatedDate = new Date().toLocaleDateString("en-KE", {
      year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

    const htmlContent = buildHTML(sales, summaryData || {}, meta, generatedDate);

    console.log("[Worker] Rendering PDF...");

    browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint });
    page = await browser.newPage();
    page.setDefaultNavigationTimeout(30000);

    await page.setContent(htmlContent, { waitUntil: "domcontentloaded" });
    await page.waitForNetworkIdle({ timeout: 5000 }).catch(() => { });

    const pdfBuffer = await page.pdf({
      format: "A3",           // wider so the 12-column table breathes
      landscape: true,        // landscape for wide transaction tables
      printBackground: true,
      margin: { top: "8mm", right: "8mm", bottom: "12mm", left: "8mm" },
      displayHeaderFooter: true,
      headerTemplate: `<span style="font-size:0;"></span>`, // header handled in HTML
      footerTemplate: `
                <div style="font-size:7px;color:#888;width:100%;text-align:center;padding-bottom:4px;">
                    Page <span class="pageNumber"></span> of <span class="totalPages"></span>
                    &nbsp;·&nbsp; ${process.env.COMPANY_NAME} · Confidential
                </div>`,
    });

    console.log(`[Worker] PDF ready. Size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);

    parentPort.postMessage({ type: "PROGRESS", progress: 100 });
    parentPort.postMessage({ type: "COMPLETE", buffer: pdfBuffer });

  } catch (err) {
    console.error("[Worker] processReport failed:", err.message);
    parentPort.postMessage({ type: "error", error: err.message });
  } finally {
    if (page) await page.close().catch(console.error);
    if (browser) await browser.disconnect().catch(console.error);
    clearInterval(memoryMonitor);
    await prisma.$disconnect().catch(console.error);
    // Exit cleanly so the thread pool slot is freed with code 0.
    // Do NOT rely on the parent calling worker.terminate() here—that exits with code 1.
    process.exit(0);
  }
}

processReport();
