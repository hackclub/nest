const fs = require("node:fs")
const { minimatch } = require('minimatch')
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const dns = require('node:dns').promises;
const os = require("os")
const isAdmin = !process.getuid() || os.userInfo().username == "nest-internal"

module.exports = {
    checkWhitelist: function (domain, username) {
        if (!fs.existsSync(__dirname + "/.whitelist")) return
        const whitelist = fs.readFileSync(__dirname + "/.whitelist", "utf8").split("\n")

        var i = 0
        while (i < whitelist.length) {
            if (minimatch(domain, whitelist[i].replace("$USERNAME", username))) return true
            i++
        }
        return false
    },
    async getDomains(username) {
        const domains = await prisma.domain.findMany({
            where: {
                username
            }
        })
        return domains
    },
    async domainExists(domain) {
        const d = await prisma.domain.findFirst({
            where: {
                domain
            }
        })
        if (!d) return false
        else return true
    },
    async domainOwnership(domain, username) {
        if (isAdmin) return true // If sudo, skip.
        const d = await prisma.domain.findFirst({
            where: {
                domain,
                username
            }
        })
        if (!d) return false
        else return true
    },
    async checkVerification(domain, username) {
        if (isAdmin) return true // If sudo, skip.
        try {
            const records = await dns.resolveTxt(domain);

            for (const record of records) {
                for (const entry of record) {
                    if (entry.includes('domain-verification=' + username)) {
                        return true;
                    }
                }
            }

            return false;
        } catch (err) {
            console.error('Error:', err);
            return false;
        }
    },
    async reloadCaddy() {
        const domains = await prisma.domain.findMany({
            where: {

            }
        })
        var caddy = {
            admin: {
                listen: "unix//run/caddy/caddy-admin.sock"
            },
            logging: {
                logs: {
                    default: {
                        encoder: {
                            format: "console"
                        }
                    }
                }
            },
            apps: {
                http: {
                    servers: {
                        srv0: {
                            listen: [":443", ":80"],
                            routes: [], // normal routes
                            errors: {
                                routes: [] // error routing
                            }
                        }
                    }
                },
                tls: {
                    automation: {
                        policies: [],
                        on_demand: {
                            permission: {
                                endpoint: "https://my.hackclub.app/ok",
                                module: "http"
                            }
                        }
                    }
                }
            }
        }
        // dn42 certification support

        const dn42Domains = domains.filter(domain => domain.domain.endsWith(".dn42")).map(domain => domain.domain)
        if (dn42Domains.length > 1) {
            caddy.apps.tls.automation.policies.push({
                "subjects": dn42Domains,
                "issuers": [
                    {
                        "ca": "https://acme.burble.dn42/v1/dn42/acme/directory",
                        "module": "acme"
                    }
                ]
            })
        }
        domains.forEach(domain => {
            caddy.apps.http.servers.srv0.routes.push({
                "match": [
                    {
                        "host": [
                            domain.domain
                        ]
                    }
                ],
                "handle": [
                    {
                        "handler": "subroute",
                        "routes": [
                            {
                                "handle": [
                                    {
                                        "handler": "reverse_proxy",
                                        "health_checks": {
                                            "active": {
                                                "expect_status": 2,
                                                "interval": "60s",
                                                "timeout": "5s"
                                            }
                                        },
                                        "upstreams": [
                                            {
                                                "dial": domain.proxy
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ],
                "terminal": true
            })

            caddy.apps.http.servers.srv0.errors.routes.push({
                "match": [
                    {
                        "host": [
                            domain.domain
                        ]
                    }
                ],
                "handle": [
                    {
                        "handler": "subroute",
                        "routes": [
                            {
                                "handle": [
                                    {
                                        "handler": "subroute",
                                        "routes": [
                                            {
                                                "handle": [
                                                    {
                                                        "body": "This site is either down or does not exist.\nIf this site really does exist, please make sure your Caddy is running. Try systemctl --user start caddy. It is also possible you have a >\n",
                                                        "handler": "static_response",
                                                        "status_code": 502
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ],
                                "match": [
                                    {
                                        "expression": "{err.status_code} == 502"
                                    }
                                ]
                            },
                            {
                                "handle": [
                                    {
                                        "body": `Something went wrong on the project owner's end. You may want to contact ${domain.username} [at] hackclub [dot] app to resolve this issue.`,
                                        "close": true,
                                        "handler": "static_response"
                                    }
                                ]
                            }
                        ]
                    }
                ],
                "terminal": true
            })
        })
        await fetch(process.env.CADDY_ADMIN_PATH || 'http://localhost:2019/load', {
            unix: process.env.CADDY_SOCKET_PATH,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Host': "127.0.0.1"
            },
            body: JSON.stringify(caddy)
        });
    }
}