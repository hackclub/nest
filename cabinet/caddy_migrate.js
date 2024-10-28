const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const data = JSON.parse("./caddyfile.json");

const set = [];
const routes = data.apps.http.servers.srv0.routes;

routes.forEach((route) => {
  const match = route.match && route.match[0];
  const handle = route.handle && route.handle[0];

  if (match && match.host && handle && handle.routes) {
    const proxyRoute = handle.routes[0].handle[0];
    if (proxyRoute.handler === "reverse_proxy") {
      const proxyDial = proxyRoute.upstreams[0].dial;
      match.host.forEach((hostname) => {
        if (!hostname || !proxyDial) return;
        const match = proxyDial.match(/\/home\/([^\/]+)\//);
        const username = match && match[1] ? match[1] : "root";

        set.push({ domain: hostname, proxy: proxyDial, username: username });
      });
    }
  }
});
async function main() {
  await prisma.domain.createMany({
    data: set,
  });
}
main();
