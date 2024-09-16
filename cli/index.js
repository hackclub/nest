#!/usr/local/bin/bun
if (typeof Bun == "undefined") {
    console.log("The Nest CLI requires bun (bun.sh) to run.")
    process.exit(1)
}
const { Command } = require('commander');
const program = new Command();
const { execSync } = require('child_process');
const { semver } = require("bun")

if (!semver.satisfies(Bun.version, ">1.1.25")) {
    console.log(`The Nest CLI requires a bun version greater than 1.1.25 to run. You can run "bun upgrade" to upgrade it.`)
    process.exit(1)
}
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