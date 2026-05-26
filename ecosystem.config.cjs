require("dotenv").config({ path: "./.env" });

module.exports = {
  apps: [
    {
      // General
      name: "T10stores_test_production",
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
      output: "./logs/out-test.log",
      error: "./logs/error-test.log",
      merge_logs: true,
    },
    {
      name: "cron_jobs_app_test_production",
      script: "./src/cron_jobs_app.js",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      output: "./logs/cron-out-test.log",
      error: "./logs/cron-error-test.log",
    },
  ],
};
