import express from "express";
import cron from "node-cron";
import { App } from "./express-app.js";
import { connectionDB } from "./databases/connectionDB.js";
import dotEnv from "dotenv";
import { QueryAnalyzer } from "./databases/repository/queryAnalyzer.js";
import { calculateAndStoreKPIs } from "../scripts/calculate-kpis.js";
dotEnv.config();
const analyzer = new QueryAnalyzer();
// setInterval(() => {
//   const memUsage = process.memoryUsage();
//   const cpuUsage = process.cpuUsage();

//   console.log(`--- Resource Usage ---`);
//   console.log(`RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`);
//   console.log(`Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
//   console.log(
//     `CPU Time: User ${cpuUsage.user / 1000}ms, System ${
//       cpuUsage.system / 1000
//     }ms`
//   );
//   console.log("----------------------\n");
// }, 5000); // every 5s

const PORT = process.env.PORT || 3001;
const HOST = "0.0.0.0";
const startServer = async () => {
  await analyzer.analyze(async () => {
    const app = express();
    await App(app); // Initialize your app

    // Schedule the KPI calculation job to run every day at 1:00 AM
    cron.schedule('0 1 * * *', () => {
      console.log('Running scheduled KPI calculation job...');
      const yesterday = new Date(Date.now() - 86400000);
      calculateAndStoreKPIs(yesterday);
    }, {
      scheduled: true,
      timezone: "Africa/Nairobi"
    });

    app.listen(PORT, HOST, () => {
      console.log(`Server running on port ${PORT}`);
      console.log('KPI calculation job is scheduled to run every day at 1:00 AM.');
    });
  });
};
startServer();
