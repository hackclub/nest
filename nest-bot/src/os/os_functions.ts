import { readFile, writeFile } from "fs/promises";
import { exec, ExecException } from "child_process";

export async function add_root_caddyfile_config(username: string) {
  const templateConfig = (
    await readFile("./src/os/templates/root_caddyfile_config.txt")
  ).toString("utf8");

  const newConfig = templateConfig.replace(/<username>/g, username);

  await writeFile("/etc/caddy/Caddyfile", newConfig, { flag: "a" });
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
    log_output,
  );
}

export function home_script(username: string) {
  exec(
    `sudo /home/nest-internal/nest/nest-bot/src/os/scripts/create_home.sh ${username}`,
    log_output,
  );
}
