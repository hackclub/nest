import { exec } from "child_process";
import { promisify } from "util";
import { existsSync, mkdirSync, writeFileSync } from "fs";

const execAsync = promisify(exec);

// Note - run this script as root
(async () => {
  const users = await execAsync("getent passwd | cut -d: -f1,3");
  const usernames = users.stdout
    .split("\n")
    .map((u) => u.split(":"))
    .filter((n) => parseInt(n[1]) >= 2000 && parseInt(n[1]) < 3000)
    .map((n) => n[0]);

  for (const user of usernames) {
    console.log(`Migrating keys of ${user}`);
    const { stdout: keys, stderr } = await execAsync(
      `/etc/ssh/ldap_script.sh ${user}`,
    );

    if (stderr) {
      console.error(`Error message when fetching keys of ${user}: ${stderr}`);
      continue;
    }

    console.log(`Keys: ${keys}`);

    if (!existsSync(`/home/${user}/.ssh`)) {
      console.log(`Creating .ssh directory for ${user}`);
      mkdirSync(`/home/${user}/.ssh`, {
        mode: "700",
      });
    }

    console.log(`Appending SSH keys to user file`);
    writeFileSync(`/home/${user}/.ssh/authorized_keys`, keys, {
      mode: "700",
      flag: "a",
    });

    console.log(`Successfully migrated ${user}\n`);
  }
})();
