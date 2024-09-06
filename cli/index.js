#!/usr/bin/env node
const { Command } = require('commander');
const program = new Command();
const { execSync, spawn } = require('child_process');
const net = require('net');
const fs = require('fs');
const utils = require("./utils")
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const os = require("os")
var username = os.userInfo().username
const isAdmin = !process.getuid() || os.userInfo().username == "nest-internal"
const validator = require('validator');

function run(command) {
    try {
        console.log(`> ${command}`)
        return execSync(command, { stdio: 'pipe' }).toString();
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}
program
    .name('nest')
    .description('A command-line interface for Nest tools and services')
    .version(require("./package.json").version);
program
    .command('get_port')
    .description('Get an open port to use for your app')
    .action(() => {
        const server = net.createServer();
        server.listen(0, '127.0.0.1', () => {
            const port = server.address().port;
            console.log(`Port ${port} is free to use!`);
            server.close();
        });
    });

program
    .command('resources')
    .description('See your Nest resource usage and limits')
    .action(() => {
        const output = run(`quota`).toString();
        const numbers = output.split("\n").find(line => line.includes("/dev/sda")).match(/\d+/g);
        const array = numbers.map(Number)
        const blockSize = 1024;

        const usedGB = (array[1] * blockSize) / (1024 ** 3);
        const quotaGB = (array[2] * blockSize) / (1024 ** 3);

        console.log(`Disk usage: ${usedGB.toFixed(2)} GB used out of ${quotaGB.toFixed(2)} GB limit`);

        const userId = process.getuid()
        const memoryUsage = (parseFloat(fs.readFileSync(`/sys/fs/cgroup/user.slice/user-${userId}.slice/memory.current`)) / (1024 * 1024 * 1024)).toFixed(2);
        const memoryLimit = (parseFloat(fs.readFileSync(`/sys/fs/cgroup/user.slice/user-${userId}.slice/memory.high`)) / (1024 * 1024 * 1024)).toFixed(2);
        console.log(`Memory usage: ${memoryUsage} GB used out of ${memoryLimit} GB limit`);
    });
const setup = program.command('setup');
setup
    .command('docker')
    .description('Set up rootless docker, so you can run docker containers')
    .action(() => {
        run('dockerd-rootless-setuptool.sh install');
        run(`sed -i '/^ExecStart/ s/$/ --exec-opt native.cgroupdriver=cgroupfs /' ~/.config/systemd/user/docker.service`);
        run('systemctl --user daemon-reload');
        run('systemctl --user enable docker');
        run('systemctl --user restart docker');
        run('docker context use rootless');
        console.log('Successfully configured docker.');
    });
const db = program.command("db")

db
    .command('create <name>')
    .description('Create a new Postgres database')
    .action((name) => {
        if (/[^a-z0-9]/gi.test(name)) {
            console.error("Your database name can only include alphanumeric characters (a-Z, 0-9)")
            process.exit(1)
        }
        run(`sudo -u postgres /usr/local/nest/cli/helpers/create_db.sh ${name}`);
    });

const caddy = program.command("caddy")
caddy
.command('list')
    .description('lists all domains you have configured in caddy')
    .option('--user', 'allows you to add a domain on behalf of a user (requires sudo)')
    .action(async (options) => {
        if (options?.user && isAdmin) username = options.user
        var domains = await utils.getDomains(username)
        domains = domains.map(domain => `- ${domain.domain} (${domain.proxy})`).join("\n")
        console.log(domains)
    });
caddy
.command('add <domain>')
.description('adds a domain to caddy')
.option('--proxy', 'changes where the domain should be proxied to (advanced)')
.option('--user', 'allows you to add a domain on behalf of a user (requires sudo)')
.action(async (domain, options) => {
    if (options?.user && isAdmin) username = options.user
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
    .option('--user', 'allows you to add a domain on behalf of a user (requires sudo)')
    .action(async (domain, options) => {
        if (options?.user && isAdmin) username = options.user
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
program.parse(process.argv);