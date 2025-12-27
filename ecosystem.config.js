
require('dotenv').config({ path: './.env' });

module.exports = {
  apps: [
    {
      name: 'T10stores',
      script: 'src/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        ...process.env
      },
    },
  ],
};
