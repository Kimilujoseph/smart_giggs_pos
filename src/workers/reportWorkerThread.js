import { parentPort, workerData } from "worker_threads";
import { salesmanagment } from "../services/sales-services.js";
import { KpiService } from "../services/kpi-service.js";
import puppeteer from "puppeteer";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { buildHTML, buildReportMeta } from "./reportTemplate.js";
dotenv.config();

// Each worker thread owns its own Prisma instance — disconnected in finally{}
// to prevent connection-pool exhaustion across concurrent workers.
const prisma = new PrismaClient();
const salesService = new salesmanagment();
const kpiService   = new KpiService();

// ── Main worker ───────────────────────────────────────────────────────────────
async function processReport() {
  const { jobParams, wsEndpoint } = workerData;
  let browser, page;

  const memoryMonitor = setInterval(() => {
    try {
      const u = process.memoryUsage();
      if (u.heapUsed > 1.5 * 1024 ** 3)
        parentPort.postMessage({ type: "MEMORY_WARNING", u });
    } catch (e) {
      console.error("[Worker] Memory monitor error:", e);
    }
  }, 5000);

  try {
    console.log("[Worker] Fetching data for job params:", jobParams);

    // All DB/service calls run in parallel
    const [summaryData, spRes, shRes, acRes, simRes] = await Promise.all([
      salesService._getSummarySalesData(jobParams),
      salesService.generategeneralsales({ ...jobParams, model: "mobiles",   itemType: "smartphones" }),
      salesService.generategeneralsales({ ...jobParams, model: "mobiles",   itemType: "smallphones" }),
      salesService.generategeneralsales({ ...jobParams, model: "accessory", itemType: "accessories" }),
      salesService.generategeneralsales({ ...jobParams, model: "simcards",  itemType: "simcards"    }),
    ]);

    const salesKpi = await kpiService.getKpiAchievementReport(summaryData, {
      startDate: jobParams.startDate,
      endDate:   jobParams.endDate,
    });

    console.log("salesKpi", salesKpi);
    console.log("summaryData", summaryData);

    // Group rows by product category
    const groups = {
      smartphones: spRes?.sales?.sales  || [],
      smallPhones: shRes?.sales?.sales  || [],
      accessories: acRes?.sales?.sales  || [],
      simCards:    simRes?.sales?.sales || [],
    };

    const totalRows = Object.values(groups).reduce((n, a) => n + a.length, 0);
    console.log(
      `[Worker] Fetched ${totalRows} rows. ` +
      `Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(0)} MB`
    );

    // Build report metadata from all rows combined
    const allSales = [
      ...groups.smartphones, ...groups.smallPhones,
      ...groups.accessories, ...groups.simCards,
    ];
    const meta = buildReportMeta(jobParams, allSales);
    const generatedDate = new Date().toLocaleDateString("en-KE", {
      year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

    // userRole controls profit column visibility (manager / superuser only)
    const userRole = jobParams.userRole || jobParams.userRol || "";

    // Delegate all HTML generation to the template module
    const htmlContent = buildHTML(
      groups,
      summaryData || {},
      salesKpi,
      meta,
      generatedDate,
      userRole
    );

    console.log("[Worker] Rendering PDF...");
    browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint });
    page    = await browser.newPage();
    page.setDefaultNavigationTimeout(30000);

    await page.setContent(htmlContent, { waitUntil: "domcontentloaded" });
    await page.waitForNetworkIdle({ timeout: 5000 }).catch(() => {});

    const pdfBuffer = await page.pdf({
      format:        "A3",
      landscape:     true,
      printBackground: true,
      margin: { top: "8mm", right: "8mm", bottom: "12mm", left: "8mm" },
      displayHeaderFooter: true,
      headerTemplate: `<span style="font-size:0;"></span>`,
      footerTemplate: `
        <div style="font-size:7px;color:#888;width:100%;text-align:center;padding-bottom:4px;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
          &nbsp;·&nbsp; ${process.env.COMPANY_NAME || "SmartGiggs POS"} · Confidential
        </div>`,
    });

    console.log(`[Worker] PDF ready. Size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);
    parentPort.postMessage({ type: "PROGRESS", progress: 100 });
    parentPort.postMessage({ type: "COMPLETE", buffer: pdfBuffer });

  } catch (err) {
    console.error("[Worker] processReport failed:", err.message);
    parentPort.postMessage({ type: "error", error: err.message });
  } finally {
    if (page)    await page.close().catch(console.error);
    if (browser) await browser.disconnect().catch(console.error);
    clearInterval(memoryMonitor);
    await prisma.$disconnect().catch(console.error);
    // Exit cleanly so the thread-pool slot is freed with code 0.
    // Do NOT rely on the parent calling worker.terminate() — that exits with code 1.
    process.exit(0);
  }
}

processReport();
