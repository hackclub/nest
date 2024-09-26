import { exec, execSync, ExecException } from "child_process";
import { promisify } from "util";
// @ts-expect-error
import escapeit from "escape-it";
const escape = escapeit("linux");

const execPromise = promisify(exec);

export async function add_root_caddyfile_config(username: string) {
  execSync(`nest caddy add ${username}.hackclub.app --user ${username}`);
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

  return stdout.trim().split("\n");
}

export function set_authorized_keys(user: string, keys: string[]) {
  exec(
    escape(
      "sudo",
      "/home/nest-internal/nest/nest-bot/src/os/scripts/set_keys.sh",
      user,
      keys.join("|"),
    ),
  );
}
