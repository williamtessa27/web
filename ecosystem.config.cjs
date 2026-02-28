/**
 * Configuration PM2 — Web (React / Vite)
 * Lancer après : npm run build
 * Port par défaut : 3008
 */
module.exports = {
  apps: [
    {
      name: 'collect-web',
      script: 'npm',
      args: 'run preview',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: { NODE_ENV: 'production', PORT: 3008 },
      env_production: { NODE_ENV: 'production', PORT: 3008 },
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
    },
  ],
};
