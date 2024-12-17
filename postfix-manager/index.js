// required capabilities:
// - CAP_NET_BIND_SERVICE (For listening on a port < 1024 so users can't steal its port number)
// DO NOT run as root
if (process.getuid() == 0 || process.geteuid() == 0) {
  throw new Error(
    "Refusing to run as root. This should be running as an unprivileged user."
  );
}
import express from "express";
import identHelper from "./ident-helper.js";
import sql from "./database.js";
import fs from "fs/async";
import path from "path";
function get_listen_port() {
  if (
    process.env.PORT &&
    parseInt(process.env.PORT) > 0 &&
    parseInt(process.env.PORT) < 65536
  ) {
    return parseInt(process.env.PORT);
  }
}
const app = express();
app.use(identHelper);
app.use((req, res, next) => {
    if(req.username=="nest-internal") return next();
    else return res.status(418).end("I'm a teapot. Go away and let me make tea. If this error is in error, email my supervisors at admins@hackclub.app. :3c");
});
app.get("/", (req, res) => {
    return res.json({
        routes: {
            "/": {
                description: "Documentation over HTTP"
            }
        }
    })
});
app.get("/list", async (req, res) => {
  const sql_res = await sql`SELECT * FROM relay_domains`;
  return res.json(sql_res);
});
app.get("/create", async (req, res) => {
  const sql_res = await sql`INSERT INTO relay_domains(hostname, username, ip, port) VALUES (${req.query.hostname}, ${req.query.username}, ${req.query?.ip||"127.0.0.1"}, ${parseInt(req.query.port)})`;
  return res.json({success: "maybe"});
});
app.get("/delete", async (req, res) => {
  const sql_res = await sql`DELETE FROM relay_domains WHERE hostname = ${req.query.hostname}`;
  return res.json({success: "maybe"});
});
app.get("/commit", async (req, res) => {
  const domains = await sql`SELECT hostname, ip, port FROM relay_domains`;
  const transportPath=path.join(process.env.STATEDIR, "transport")
  await fs.writeFile(transportPath, domains.map(item=>`${hostname} smtp:[${ip}]:${port}`).join("\n"));
  const relayDomainsPath=path.join(process.env.STATEDIR, "relay_domains");
  await fs.writeFile(transportPath, domains.map(item=>`${hostname} ${hostname}`).join("\n"));
  /*
   * This part gets interesting.
   * When we do this, a systemd service unit should have a start job queued by a systemd path unit configured to monitor this file.
   * This lets us reload postfix without root. :p
   */
  const triggerPath=path.join(process.env.STATEDIR, "trigger");
  await fs.writeFile(triggerPath, String((Math.random())));
  return res.json({
    success: "most likely"
  });
});