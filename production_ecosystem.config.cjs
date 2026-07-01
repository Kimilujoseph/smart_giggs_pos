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
      instances: 3,

      autorestart: true,
      watch: false,
      max_memory_restart: "1G",

      // Log Management
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      output: `./logs/${process.env.APP_NAME}-out-production.log`,
      error: `./logs/${process.env.APP_NAME}-error-production.log`,
      merge_logs: true,
    },
    {
      name: process.env.CRON_JOB_APP_NAME,
      script: "./src/cron_jobs_app.js",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      output: `./logs/${process.env.CRON_JOB_APP_NAME}-out-production.log`,
      error: `./logs/${process.env.CRON_JOB_APP_NAME}-error-production.log`,
    },
  ],
};
