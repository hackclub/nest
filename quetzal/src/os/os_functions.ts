import { exec, execSync, ExecException } from "child_process";
import { promisify } from "util";
// @ts-expect-error
import escapeit from "escape-it";
const escape = escapeit("linux");

const execPromise = promisify(exec);

export async function add_root_caddyfile_config(username: string) {
  const { stdout, stderr } = await execPromise(
    `nest caddy add ${username}.hackclub.app --user ${username}`,
  );

  if (stderr) console.error(stderr);

  console.log(stdout);
}

function log_output(err: ExecException | null, stdout: string, stderr: string) {
  if (err) {
    console.error(err);
  }

  console.log(stdout);
  console.error(stderr);
}

export async function setup_script(username: string) {
  const { stdout, stderr } = await execPromise(
    `sudo /home/nest-internal/nest/quetzal/src/os/scripts/setup.sh ${username}`,
  );

  if (stderr) console.error(stderr);

  console.log(stdout);
}

export async function home_script(username: string) {
  const { stdout, stderr } = await execPromise(
    `sudo /home/nest-internal/nest/quetzal/src/os/scripts/create_home.sh ${username}`,
  );

  if (stderr) console.error(stderr);

  console.log(stdout);
}

export async function get_authorized_keys(user: string) {
  const { stdout, stderr } = await execPromise(
    `sudo /home/nest-internal/nest/quetzal/src/os/scripts/read_keys.sh ${user}`,
  );

  if (stderr) {
    throw new Error(stderr);
  }

  return stdout
    .trim()
    .split("\n")
    .filter((l) => l !== "");
}

export async function set_authorized_keys(user: string, keys: string[]) {
  const { stdout, stderr } = await execPromise(
    escape(
      "sudo",
      "/home/nest-internal/nest/quetzal/src/os/scripts/set_keys.sh",
      user,
      keys.join("|"),
    ),
  );

  if (stderr) console.error(stderr);

  console.log(stdout);
}

export async function is_user_created(username: string) {
  const { stdout, stderr } = await execPromise(`id ${username}`);

  if (stderr) console.error(stderr);

  return !stdout.includes("no such user");
}
