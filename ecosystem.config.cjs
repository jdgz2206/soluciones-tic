module.exports = {
  apps: [
    {
      name: "soluciones-tic-backend",
      cwd: "./backend",
      script: "src/server.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "soluciones-tic-frontend",
      cwd: "./frontend",
      script: "./dist/server/entry.mjs",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
