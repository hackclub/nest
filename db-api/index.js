// required capabilities:
// - CAP_NET_BIND_SERVICE (For listening on a port < 1024 so users can't steal its port number)
// DO NOT run as root
if(process.getuid()==0||process.geteuid()==0) {
  throw new Error("Refusing to run as root. This should be running as an unprivileged user.");
}
import express from "express";
import identHelper from "./ident-helper.js";
import sql from "./database.js";
const safe_regex = /^[A-Za-z0-9_-]+$/;

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
  if (req.username == "root") {
    return res.status(500).json({
      message:
        "Refusing to respond to request from root. Try accessing this API as an unprivileged user.",
    });
  }
  if (req.username.includes("_")) {
    return res.status(500).json({
      message: "Invalid username, contact an admin in #nest",
    });
  } else next();
});
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl} - ${req.socket.remoteAddress}:${req.socket.remotePort} ${req.username}`);
  next();
})
app.get("/setup/:username", async function (req, res) {
  if (safe_regex.test(req.params.username) !== true) {
    return res.status(500).json({
      message:
        "Username contains invalid characters, see /usr/local/nest/db-api/index.js line 6 for the regex used in production.",
    });
    throw new Error("We should never reach this. Bail out NOW.");
  } else if (req.username != "nest-internal") {
    return res
      .status(403)
      .json({ message: "Only nest-internal can set up a new user." });
  } else {
    await sql.unsafe(`CREATE USER "${req.params.username}"`);
    await sql.unsafe(
      `CREATE DATABASE "${req.params.username}" WITH OWNER "${req.params.username}"`
    );
    await res.status(200).json({
      message: "Successfully created user."
    });
  }
});
app.get("/whoami", function (req, res) {
  res.status(200).json({
    username: req.username,
  });
});
app.put("/db/:database", async function (req, res) {
  console.log(`/db/database`);
  if (safe_regex.test(req.params.database) !== true) {
    return res.status(403).json({
      message:
        "Database name contains invalid characters, see /usr/local/nest/db-api/index.js line 6 for the regex used in production.",
    });
    throw new Error("We should never reach this. Bail out NOW.");
  }
  if (safe_regex.test(req.username) !== true) {
    return res.status(403).json({
      message:
        "Nest username contains invalid characters, see /usr/local/nest/db-api/index.js line 6 for the regex used in production.",
    });
    throw new Error("We should never reach this. Bail out NOW.");
  }
  const database = req.params.database;
  if (database.startsWith(`${req.username}_`)) {
    await sql.unsafe(`CREATE DATABASE "${database}" WITH OWNER "${req.username}"`);
    await res.status(200).json({
      message: "Successfully created database."
    });
  }
  else {
    return res.status(403).json({
      message: "You may only create databases with a name formatted like ${username}_${database}."
    });
  }
});
app.get("/db/:database/ownership", async function (req, res) {
  res.json(
    (
      await sql`SELECT d.datname as name,
            pg_catalog.pg_get_userbyid(d.datdba) as owner
            FROM pg_catalog.pg_database d
            WHERE d.datname = ${req.params.database}
            ORDER BY 1`
    )[0]
  );
});
app.listen(get_listen_port(), "127.0.0.1");
