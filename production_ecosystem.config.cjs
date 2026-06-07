require("dotenv").config({ path: "./.env" });

module.exports = {
  apps: [
    {
      // General
      name: "CAPTECH_production",
      script: "src/index.js",

      // Production Environment
      env_production: {
        NODE_ENV: "production",
        ...process.env,
      },

      // Clustering
      exec_mode: "cluster",
      instances: 3,

      autorestart: true,
      watch: false,
      max_memory_restart: "1G",

      // Log Management
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      output: "./logs/out-production.log",
      error: "./logs/error-production.log",
      merge_logs: true,
    },
    {
      name: "CAPTECH_cron_jobs_app_production",
      script: "./src/cron_jobs_app.js",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      output: "./logs/cron-out-production.log",
      error: "./logs/cron-error-production.log",
    },
  ],
};
