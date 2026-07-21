import express from "express";
import logger from "./Utils/logger.js";
import { App } from "./express-app.js";
import { connectionDB } from "./databases/connectionDB.js";
import dotEnv from "dotenv";
import { QueryAnalyzer } from "./databases/repository/queryAnalyzer.js";
import { calculateAndStoreKPIs } from "../scripts/calculate-kpis.js";
dotEnv.config();
const analyzer = new QueryAnalyzer()

const PORT = process.env.PORT || 3001;
const HOST = "0.0.0.0";
const startServer = async () => {
  await analyzer.analyze(async () => {
    const app = express();
    await App(app);
    
    app.listen(PORT, HOST, () => {
      logger.info(`Server running on port ${PORT}`);
    })
  });
};
startServer();
