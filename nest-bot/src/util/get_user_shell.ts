import { exec } from "child_process";

export default async function get_user_shell(
  tilde_username: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(
      `getent passwd ${tilde_username} | cut -d: -f7`,
      (error, stdout, stderr) => {
        if (error) {
          console.log(`error: ${error.message}`);
          reject(error);
          return;
        }
        if (stderr) {
          console.log(`stderr: ${stderr}`);
          reject(new Error(stderr));
          return;
        }
        resolve(stdout.trim());
      },
    );
  });
}
