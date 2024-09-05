#!/usr/bin/env node
const { Command } = require('commander');
const program = new Command();
const { execSync, spawn } = require('child_process');
const net = require('net');
const fs = require('fs');

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
    .description('Yet another tilde caddy manager')
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
    .command('caddy [cmd] [args...]')
    .description('Manages caddy')
    .action((cmd, args) => {
        const yatcmArgs = cmd ? [cmd, ...args] : args;
        const yatcm = spawn('yatcm', yatcmArgs);

        yatcm.stdout.on('data', (data) => {
            console.log(data.toString());
        });

        yatcm.stderr.on('data', (data) => {
            console.error(data.toString());
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
        run(`sudo -u postgres /usr/local/nest/cli/helpers/acreate_db.sh ${name}`);
    });


program.parse(process.argv);