import { readFile, writeFile } from "fs/promises";
import { exec, ExecException } from "child_process";
import { promisify } from "util";
// @ts-expect-error
import escape from "escape-it";

const execPromise = promisify(exec);

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

export async function get_authorized_keys(user: string) {
  const { stdout, stderr } = await execPromise(
    `sudo /home/nest-internal/nest/nest-bot/src/os/scripts/read_keys.sh ${user}`,
  );

  if (stderr) {
    throw new Error(stderr);
  }

  return stdout.split("\n");
}

export function set_authorized_keys(user: string, keys: string[]) {
  exec(
    escape(
      "sudo /home/nest-internal/nest/nest-bot/src/os/scripts/set_keys.sh",
      user,
      keys.join("|"),
    ),
  );
}
