module.exports = {
  apps: [
    {
      name: "hrms",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/var/www/hrms",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3030,
      },
      error_file: "/var/log/pm2/hrms-error.log",
      out_file: "/var/log/pm2/hrms-out.log",
      time: true,
      restart_delay: 3000,
      max_restarts: 10,
    },
  ],
};
