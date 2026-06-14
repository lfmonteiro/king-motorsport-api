// Arquivo de configuração do PM2
// Uso: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: "king-motorsport-api",
      script: "src/server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "200M",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      // Logs
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
