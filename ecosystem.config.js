// ecosystem.config.js
require('dotenv').config({ path: './.env' });

module.exports = {
  apps: [
    {
      // General
      name: 'T10stores',
      script: 'src/index.js',
      
      // Production Environment
      env_production: {
        NODE_ENV: 'production',
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
      output: './logs/out.log',
      error: './logs/error.log',
      merge_logs: true,
    },
  ],
};