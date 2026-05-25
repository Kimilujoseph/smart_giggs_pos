// ecosystem.config.prod-test.cjs
require('dotenv').config({ path: './.env' });

module.exports = {
  apps: [
    {
      // General
      name: 'T10stores-test', // Changed name
      script: 'src/index.js',
      
      // Production Environment (for testing on production server)
      env_production: {
        NODE_ENV: 'production', // Keep as production for now, can be changed if needed
        ...process.env
      },

      // Clustering
      exec_mode: 'cluster',
      instances: 'max', // Use all available CPU cores

      // Process Management
      autorestart: true, // Restart on crash
      watch: false,      // Do not watch for file changes in production
      max_memory_restart: '1G', // Restart if memory exceeds 1GB

      // Log Management
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      output: './logs/out-test.log', // Separate log file
      error: './logs/error-test.log', // Separate log file
      merge_logs: true,
    },
    {
      name: "cron_jobs_app-test", // Changed name
      script: "./src/cron_jobs_app.js",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      output: './logs/cron-out-test.log', // Separate log file
      error: './logs/cron-error-test.log', // Separate log file
    },
  ],
};
