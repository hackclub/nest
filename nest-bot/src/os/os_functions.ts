import { readFile, writeFile } from "fs/promises";
import { exec } from "child_process";

export async function add_root_caddyfile_config(username: string) {
  const templateConfig = (
    await readFile("./src/os/templates/root_caddyfile_config.txt")
  ).toString("utf8");

  const newConfig = templateConfig.replace(/username/g, username);

  await writeFile("/etc/caddy/Caddyfile", newConfig, { flag: "a" });
}

export function setup_script(username: string) {
  exec(
    `sudo /home/nest-internal/nest/nest-bot/src/os/scripts/setup.sh ${username}`
  );
}

export function home_script(username: string) {
  exec(
    `sudo /home/nest-internal/nest/nest-bot/src/os/scripts/create_home.sh ${username}`
  );
}
