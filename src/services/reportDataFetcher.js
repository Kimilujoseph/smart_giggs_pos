//import puppeteer from "puppeteer"
async function generatePdfMakeReport(sales, totalSales) {
    console.log("received sales", sales);

    const browser = await puppeteer.launch({
        headless: true,
        timeout: 120000,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    console.log("Chromium launched successfully");
    const page = await browser.newPage();

    // Get the current local time for Nairobi
    const generatedDate = new Intl.DateTimeFormat("en-KE", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Africa/Nairobi",
        timeZoneName: "short",
    }).format(new Date());

    // Prepare HTML content
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
            <h2>Finance Report for ${sales[0].financeDetails.financer}</h2>
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
                            <td>${sale.productName}</td>
                            <td>${sale.productModel}</td>
                            <td>${sale.IMEI}</td>
                            <td>${sale.productType}</td>
                            <td>${sale.soldprice}</td>
                            <td>${sale.customerphonenumber}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="total-sales">
                Total Sales Amount: ${totalSales.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}
            </div>
            <div class="footer">
                This document was generated on ${generatedDate}.
            </div>
        </body>
        </html>
    `;

    // Set the content of the page
    await page.setContent(htmlContent, { waitUntil: 'load' });

    // Generate PDF
    const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
    });

    await browser.close();

    return pdfBuffer;
}
async function generatePdfSalesReport(salesDetails) {
    const { sales, totalSales, totalProfit, financeSales, startDate, endDate } = salesDetails
    const browser = await puppeteer.launch({
        headless: true,
        timeout: 120000,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    console.log("Chromium launched successfully");
    const page = await browser.newPage();
    const formatDate = (date) => {
        return new Intl.DateTimeFormat("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }).format(new Date(date));
    };
    const formattedStartDate = startDate ? formatDate(startDate) : "N/A";
    const formattedEndDate = endDate ? formatDate(endDate) : "N/A";
    const generatedDate = new Intl.DateTimeFormat("en-KE", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Africa/Nairobi",
        timeZoneName: "short",
    }).format(new Date());

    // Prepare HTML content
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>General Sales Report</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    font-size: 10px; /* Smaller font for compact layout */
                }
                h1, h2 {
                    text-align: center;
                    color: #333;
                }
                .summary {
                    margin-top: 20px;
                    font-size: 12px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                    font-size: 9px; /* Smaller font for table */
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 5px;
                    text-align: left;
                    word-wrap: break-word;
                }
                th {
                    background-color: #f4f4f4;
                }
                tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                .footer {
                    text-align: center;
                    font-size: 9px;
                    margin-top: 30px;
                    color: #888;
                }
            </style>
        </head>
        <body>
            <h1>General Sales Report</h1>
            <h2>Captech Limited</h2>
            <p class="summary">
                 <strong>Date Range:</strong> ${formattedStartDate} to ${formattedEndDate}<br>
                <strong>Total Sales:</strong> ${totalSales.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}<br>
                <strong>Total Profit:</strong> ${totalProfit.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}<br>
                <strong>Total Finance Sales Pending:</strong> ${financeSales.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}
            </p>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Product Name</th>
                        <th>Model</th>
                        <th>Category</th>
                        <th>Sold Price</th>
                        <th>Net Amount</th>
                        <th>Commission</th>
                        <th>Profit</th>
                        <th>Sale Type</th>
                        <th>Finance Status</th>
                        <th>Financer</th>
                        <th>Shop Name</th>
                        <th>Seller Name</th>
                    </tr>
                </thead>
                <tbody>
                    ${sales.map((sale, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${sale.productname}</td>
                            <td>${sale.productmodel}</td>
                            <td>${sale.category}</td>
                            <td>${sale.soldprice.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</td>
                            <td>${sale.netamountsoldforthegood.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</td>
                            <td>${sale.commission.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</td>
                            <td>${sale.totalprofit.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</td>
                            <td>${sale.saleType}</td>
                            <td>${sale.financeDetails.financeStatus}</td>
                            <td>${sale.financeDetails.financer || "N/A"}</td>
                            <td>${sale.shopname.join(', ')}</td>
                            <td>${sale.sellername}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="footer">
                Report generated on ${generatedDate}.
            </div>
        </body>
        </html>
    `;

    // Set the content of the page
    await page.setContent(htmlContent, { waitUntil: 'load' });

    // Generate PDF
    const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
    });

    await browser.close();

    return pdfBuffer;
}

export { generatePdfMakeReport, generatePdfSalesReport };
