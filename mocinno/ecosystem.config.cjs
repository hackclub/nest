module.exports = {
  apps: [{
    name: "cpuscanner",
    script: "/root/.bun/bin/bun",
    args: "run backend/src/cpuscanner.ts",
    interpreter: "none",
    cwd: "/root/mocinno",
    env_file: "/root/mocinno/.env",
    max_restarts: 10
  }]
}
