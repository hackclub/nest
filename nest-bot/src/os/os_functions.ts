import { readFile, writeFile } from "fs/promises";
import { exec, ExecException, execSync } from "child_process";

export async function add_root_caddyfile_config(username: string) {
  execSync(`nest caddy add ${username}.hackclub.app --user ${username}`)
}

function log_output(err: ExecException | null, stdout: string, stderr: string) {
  if (err) {
    console.error(err);
  }

  console.log(stdout);
  console.error(stderr);
}

export function setup_script(username: string) {
  exec(
    `sudo /home/nest-internal/nest/nest-bot/src/os/scripts/setup.sh ${username}`,
    log_output
  );
}

export function home_script(username: string) {
  exec(
    `sudo /home/nest-internal/nest/nest-bot/src/os/scripts/create_home.sh ${username}`,
    log_output
  );
}
