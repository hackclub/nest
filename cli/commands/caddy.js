const utils = require("../utils")
const os = require("node:os")
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const validator = require('validator');
const isAdmin = !process.getuid() || os.userInfo().username == "nest-internal"
module.exports = function ({ program, run }) {
    const caddy = program.command("caddy")
    var username = os.userInfo().username
    caddy
        .command('list')
        .description('lists all domains you have configured in caddy')
        .option('--user [user]', 'allows you to add a domain on behalf of a user (requires sudo)')
        .action(async (options) => {
            if (options?.user && !isAdmin) {
                console.error("To change/see another user's domains, you'll need to use sudo or be root.")
                process.exit(1)
            } else if (options?.user) {
                username = options.user
            }
            var domains = await utils.getDomains(username)
            domains = domains.map(domain => `- ${domain.domain} (${domain.proxy})`).join("\n")
            console.log(domains)
        });
    caddy
        .command('add <domain>')
        .description('adds a domain to caddy')
        .option('--proxy [proxy]', 'changes where the domain should be proxied to (advanced)')
        .option('--user [user]', "allows you to list a different user's domains (requires sudo)")
        .action(async (domain, options) => {
            if (options?.user && !isAdmin) {
                console.error("To change/see another user's domains, you'll need to use sudo or be root.")
                process.exit(1)
            } else if (options?.user) {
                username = options.user
            }
            if (!validator.isFQDN(domain)) {
                console.error("This domain is not a valid domain name. Please choose a valid domain name.")
                process.exit(1)
            }
            if (await utils.domainExists(domain)) {
                console.error("This domain already has already been taken by you or someone else. Pick another one!")
                process.exit(1)
            }
            if (utils.checkWhitelist(domain, username)) {
                await prisma.domain.create({
                    data: {
                        domain, username, proxy: options?.proxy || `unix//home/${username}/.${domain}.webserver.sock`
                    }
                })
                await utils.reloadCaddy()
                return console.log(`${domain} added. (${options?.proxy || `unix//home/${username}/.${domain}.webserver.sock`})`)

            }
            // Proceed as a regular domain
            if (!await utils.checkVerification(domain, username)) {
                console.error(`Please set the TXT record for domain-verification to your username (${username}). You can remove it after it is added.`)
                process.exit(1)
            }
            await prisma.domain.create({
                data: {
                    domain, username, proxy: options?.proxy || `unix//home/${username}/.${domain}.webserver.sock`
                }
            })
            await utils.reloadCaddy()
            return console.log(`${domain} added. (${options?.proxy || `unix//home/${username}/.${domain}.webserver.sock`})`)
        });
    caddy
        .command('rm <domain>')
        .description('removes a domain from caddy')
        .option('--user [user]', 'allows you to add a domain on behalf of a user (requires sudo)')
        .action(async (domain, options) => {
            if (options?.user && !isAdmin) {
                console.error("To change/see another user's domains, you'll need to use sudo or be root.")
                process.exit(1)
            } else if (options?.user) {
                username = options.user
            }
            if (!validator.isFQDN(domain)) {
                console.error("This domain is not a valid domain name. Please choose a valid domain name.")
                process.exit(1)
            }
            if (!await utils.domainExists(domain)) {
                console.error("This domain is not in Caddy.")
                process.exit(1)
            }
            if (!await utils.domainOwnership(domain, username)) {
                console.error("You do not own the domain, so you cannot remove it.")
                process.exit(1)
            }
            await prisma.domain.delete({
                where: {
                    domain, username
                }
            })
            await utils.reloadCaddy()
            console.log(`${domain} removed.`)
        });
    caddy
        .command('reload')
        .description('reloads the global caddy instance (admins only)')
        .action(async () => {
            if (!isAdmin) {
                console.error("To reload the global caddy instance, you must use sudo.")
                return process.exit(1)
            } 
            await utils.reloadCaddy()
            console.log(`Global Caddy instance reloaded.`)
        });
}