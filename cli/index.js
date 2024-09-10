#!/usr/bin/env bun
const { Command } = require('commander');
const program = new Command();
const { execSync } = require('child_process');

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


require("./commands/setup")({ program, run })
require("./commands/db")({ program, run })
require("./commands/caddy")({ program, run })
require("./commands/resources")({ program, run })
require("./commands/get_port")({ program, run })

program.parse(process.argv);