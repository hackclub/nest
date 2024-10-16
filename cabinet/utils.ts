import fs from "fs";
import { minimatch } from "minimatch";
import dns from "dns/promises";

import { prisma } from "./prisma";

export async function domainExists(domain: string) {
  const d = await prisma.domain.findFirst({
    where: {
      domain,
    },
  });
  if (!d) return false;
  else return true;
}

export function checkWhitelist(domain: string, username: string) {
  if (!fs.existsSync(__dirname + "/.whitelist")) return;
  const whitelist = fs
    .readFileSync(__dirname + "/.whitelist", "utf8")
    .split("\n");

  var i = 0;
  while (i < whitelist.length) {
    if (minimatch(domain, whitelist[i].replace("$USERNAME", username)))
      return true;
    i++;
  }
  return false;
}

export async function reloadCaddy() {
  const domains = await prisma.domain.findMany({
    where: {},
  });
  var caddy = {
    admin: {
      listen: "unix//run/caddy/caddy-admin.sock",
    },
    logging: {
      logs: {
        default: {
          encoder: {
            format: "console",
          },
        },
      },
    },
    apps: {
      http: {
        servers: {
          srv0: {
            listen: [":443", ":80"],
            routes: [], // normal routes
            errors: {
              routes: [], // error routing
            },
          },
        },
      },
      tls: {
        automation: {
          policies: [],
          on_demand: {
            permission: {
              endpoint: "https://my.hackclub.app/ok",
              module: "http",
            },
          },
        },
      },
    },
  };
  // dn42 certification support

  const dn42Domains = domains
    .filter((domain) => domain.domain.endsWith(".dn42"))
    .map((domain) => domain.domain);
  if (dn42Domains.length > 1) {
    caddy.apps.tls.automation.policies.push({
      subjects: dn42Domains,
      issuers: [
        {
          ca: "https://acme.burble.dn42/v1/dn42/acme/directory",
          module: "acme",
        },
      ],
    });
  }

  for (const domain of domains) {
    caddy.apps.http.servers.srv0.routes.push({
      match: [
        {
          host: [domain.domain],
        },
      ],
      handle: [
        {
          handler: "subroute",
          routes: [
            {
              handle: [
                {
                  handler: "reverse_proxy",
                  health_checks: {
                    active: {
                      expect_status: 2,
                      interval: "60s",
                      timeout: "5s",
                    },
                  },
                  upstreams: [
                    {
                      dial: domain.proxy,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      terminal: true,
    });

    let specifiedEmail = null;
    try {
      specifiedEmail = fs.readFileSync(
        `/home/${domain.username}/.error-page-email`,
        "utf8",
      );
    } catch (err) {
      // ENOENT is thrown when the file's not found
      if (err.code != "ENOENT") {
        throw err;
      }
    }

    const userEmail = specifiedEmail
      ? specifiedEmail.replace("@", " [at] ").replace(/\./g, " [dot] ")
      : `${domain.username} [at] hackclub [dot] app`;

    caddy.apps.http.servers.srv0.errors.routes.push({
      match: [
        {
          host: [domain.domain],
        },
      ],
      handle: [
        {
          handler: "subroute",
          routes: [
            {
              handle: [
                {
                  handler: "subroute",
                  routes: [
                    {
                      handle: [
                        {
                          body: `This site is either down or does not exist.\nIf this site really does exist, please make sure your Caddy is running. Try systemctl --user start caddy. It is also possible you have a fault in your Caddyfile. Check it for errors..\n\n
                                          .MM.
                                          ;MM.
KKc.lONMMWXk;    ckXWMMWXk:   'xXWMMWXxoKKNMMXKKKK
MMXNo'.  .lWM0.oWNo'.  .,dWWldMW:.  .:XMN'dMM:....
MMW.       :MMWMN.        'MMMMWc.     .. cMM.
MMO        .MMMMWXXXXXXXXXXWWO,dKNMNKOd:. cMM.
MMO        .MMMMX                  .':OMMccMM.
MMO        .MMKNMO.      .kK0KKl      .MMk:MM;
MMO        .MMd.oXMKxoox0MXl ,OMNkdodkWWk. kWMKOOo
dd:        .dd;   ,xKNNKx,     .o0XNX0l.    .:oddc
- hackclub.app`,
                          handler: "static_response",
                          status_code: 502,
                        },
                      ],
                    },
                  ],
                },
              ],
              match: [
                {
                  expression: "{err.status_code} == 502",
                },
              ],
            },
            {
              handle: [
                {
                  body: `Something went wrong on the project owner's end. You may want to contact ${userEmail} to resolve this issue.\n\n
                                          .MM.
                                          ;MM.
KKc.lONMMWXk;    ckXWMMWXk:   'xXWMMWXxoKKNMMXKKKK
MMXNo'.  .lWM0.oWNo'.  .,dWWldMW:.  .:XMN'dMM:....
MMW.       :MMWMN.        'MMMMWc.     .. cMM.
MMO        .MMMMWXXXXXXXXXXWWO,dKNMNKOd:. cMM.
MMO        .MMMMX                  .':OMMccMM.
MMO        .MMKNMO.      .kK0KKl      .MMk:MM;
MMO        .MMd.oXMKxoox0MXl ,OMNkdodkWWk. kWMKOOo
dd:        .dd;   ,xKNNKx,     .o0XNX0l.    .:oddc
- hackclub.app`,
                  close: true,
                  handler: "static_response",
                },
              ],
            },
          ],
        },
      ],
      terminal: true,
    });
  }

  await fetch(process.env.CADDY_ADMIN_PATH || "http://localhost:2019/load", {
    // @ts-expect-error
    unix: process.env.CADDY_SOCKET_PATH,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Host: "127.0.0.1",
    },
    body: JSON.stringify(caddy),
  });
}

export async function checkVerification(domain, username) {
  if (username == "nest-internal" || username == "root") return true; // If sudo, skip.
  try {
    const txtRecords = await dns.resolveTxt(domain).catch(() => []);
    const cnameRecords = await dns.resolveCname(domain).catch(() => []);

    for (const record of txtRecords) {
      for (const entry of record) {
        if (entry.includes("domain-verification=" + username)) {
          return true;
        }
      }
    }

    return cnameRecords.includes(`${username}.hackclub.app`);
  } catch (err) {
    console.error("Error:", err);
    return false;
  }
}

export async function domainOwnership(domain, username) {
  if (username == "nest-internal" || username == "root") return true; // If sudo, skip.
  const d = await prisma.domain.findFirst({
    where: {
      domain,
      username,
    },
  });
  if (!d) return false;
  else return true;
}
