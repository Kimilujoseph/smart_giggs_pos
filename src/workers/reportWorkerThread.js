import { parentPort, workerData } from "worker_threads";
import { salesmanagment } from "../services/sales-services.js";
import puppeteer from "puppeteer";

const salesService = new salesmanagment();

async function processReport() {
    const { jobParams, wsEndpoint } = workerData;
    let browser, page;

    const memoryMonitor = setInterval(() => {
        try {
            const usage = process.memoryUsage();
            if (usage.heapUsed > 1.5 * 1024 * 1024 * 1024) {
                parentPort.postMessage({ type: "MEMORY_WARNING", usage });
            }
        } catch (error) {
            console.error("Memory Monitor Error", error);
        }
    }, 5000);

    try {
        console.log("Processing report for job: ", jobParams);
        const summaryData = await salesService._getSummarySalesData(jobParams);
        const mobileSales = await salesService.generategeneralsales({ ...jobParams, model: "mobiles" });
        const accessorysales = await salesService.generategeneralsales({ ...jobParams, model: "accessory" });
        const rawData = [...mobileSales.sales.sales, ...accessorysales.sales.sales];

        const sales = rawData || [];
        const totalSales = summaryData?.totalSales || 0;

        const financerName = sales.length > 0 ? (sales[0].financeDetails?.financer || "N/A") : "N/A";
        const generatedDate = new Date().toLocaleDateString("en-KE", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });

        const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Sales Report</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    font-size: 10px; /* Smaller, readable font */
                }
                h1, h2 {
                    text-align: center;
                    color: #333;
                }
                table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    margin-top: 20px;
                    font-size: 9px; /* Smaller font for table */
                    border: 1px solid #ddd;
                    border-radius: 8px; /* Rounded edges */
                    overflow: hidden;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 6px;
                    text-align: left;
                    word-wrap: break-word; /* Prevent overflow */
                }
                th {
                    background-color: #f4f4f4;
                    color: #333;
                }
                tr:nth-child(even) {
                    background-color: #f9f9f9; /* Alternate row colors */
                }
                tr:hover {
                    background-color: #f1f1f1; /* Highlight row on hover */
                }
                .trust-badge {
                    text-align: center;
                    margin-top: 10px;
                    font-size: 12px;
                    font-style: italic;
                    color: #555;
                }
                .footer {
                    text-align: center;
                    font-size: 8px;
                    margin-top: 30px;
                    color: #888;
                }
                .total-sales {
                    font-weight: bold;
                    margin-top: 20px;
                    text-align: right;
                    font-size: 10px;
                    color: #333;
                }
            </style>
        </head>
        <body>
            <h1>Captech Limited Sales Report</h1>
            <h2>Finance Report for ${financerName}</h2>
            <div class="trust-badge">
                Trusted by leading businesses worldwide
            </div>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Model</th>
                        <th>IMEI</th>
                        <th>Storage</th>
                        <th>Sold Price</th>
                        <th>Phone Number</th>
                    </tr>
                </thead>
                <tbody>
                    ${sales.map((sale, index) => `
                        <tr>
                            <td>${index + 1}</td> <!-- Row number -->
                            <td>${sale.productname}</td>
                            <td>${sale.productmodel}</td>
                            <td>${sale.IMEI}</td>
                            <td>${sale.productType}</td>
                            <td>${sale.soldprice}</td>
                            <td>${sale.customerphonenumber}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
            <div class="total-sales">
                Total Sales Amount: ${totalSales.toLocaleString("en-KE", { style: "currency", currency: "KES" })}
            </div>
            <div class="footer">
                This document was generated on ${generatedDate}.
            </div>
        </body>
        </html>
    `;

        browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint });
        page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: "domcontentloaded" });

        await new Promise(resolve => setTimeout(resolve, 1000));

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
            displayHeaderFooter: true,
            headerTemplate: '<div style="font-size: 10px; margin-left: 1cm;">Finance Report</div>',
            footerTemplate: '<div style="font-size: 8px; margin-right: 1cm; color: #888; width: 100%; text-align: right;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
        });

        parentPort.postMessage({ type: "PROGRESS", progress: 100 });
        parentPort.postMessage({ type: "COMPLETE", buffer: pdfBuffer });
    } catch (err) {
        console.error("Error occurred in reportWorkerThread: ", err);
        parentPort.postMessage({ type: "error", error: err.message });
    } finally {
        if (page) {
            await page.close().catch(console.error);
        }
        if (browser) {
            await browser.disconnect().catch(console.error);
        }
        clearInterval(memoryMonitor);
    }
}

processReport();
