require("dotenv").config({ path: "./.env" });

module.exports = {
  apps: [
    {
      // General
      name: process.env.APP_NAME,
      script: "src/index.js",

      // Production Environment
      env_production: {
        NODE_ENV: "production",
        ...process.env,
      },

      // Clustering
      exec_mode: "cluster",
      instances: 2,

      autorestart: true,
      watch: false,
      max_memory_restart: "1G",

      // Log Management
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      output: `./logs/${process.env.APP_NAME}-out-test.log`,
      error: `./logs/${process.env.APP_NAME}-error-test.log`,
      merge_logs: true,
    },
    {
      name: process.env.CRON_JOB_APP_NAME,
      script: "./src/cron_jobs_app.js",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      output: `./logs/${process.env.CRON_JOB_APP_NAME}-out-test.log`,
      error: `./logs/${process.env.CRON_JOB_APP_NAME}-error-test.log`,
    },
    {
      // Dedicated PDF generation process.
      // Runs as a single fork — owns the BrowserPool (Chromium) and BullMQ
      // consumer. API cluster instances only enqueue jobs; this process renders them.
      name: process.env.PDF_WORKER_APP_NAME || "smart-giggs-pdf-worker",
      script: "./src/pdf_worker_app.js",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env_production: {
        NODE_ENV: "production",
        MAX_BROWSER: "2",
        MAX_THREADS: "4",
        ...process.env,
      },
      max_memory_restart: "1500M",
      autorestart: true,
      output: `./logs/${process.env.PDF_WORKER_APP_NAME || "smart-giggs-pdf-worker"}-out-production.log`,
      error: `./logs/${process.env.PDF_WORKER_APP_NAME || "smart-giggs-pdf-worker"}-error-production.log`,
      merge_logs: true,
    },
  ],
};
