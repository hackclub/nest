import fs from "node:fs";

export default async function get_shells(
  shell: string,
  shellPath?: string,
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    try {
      const shellFile = fs
        .readFileSync(shellPath || "/etc/shells", "utf8")
        .split("\n")
        .filter((line) => !/^\s*#/.test(line));
      console.log("shellFile", shellFile);

      const uniqueShells = shellFile
        // get a list of all unique shells
        .map((line) => line.trim())
        // remove the prefix we only care about the last part of the path eg /bin/bash -> bash and /usr/bin/bash -> bash
        // this shoudld work for all paths regardless of the prefix
        .map((line) => line.replace(/^\s*\/.*\//, ""))
        // dedupe the list
        .filter(
          (value, index, self) => self.indexOf(value) === index && value !== "",
        );

      console.log("uniqueShells", uniqueShells);

      // now loop through the shells and if the shell has a /bin/ prefix then get that version but if not then just get the first match
      const shells: string[] = uniqueShells.map(
        (shell) =>
          shellFile.find(
            (line) => line.includes(shell) && line.includes("/bin/"),
          ) || shellFile.find((line) => line.includes(shell)),
      ) as string[];

      resolve(shells);
    } catch (error) {
      if (error instanceof Error) {
        console.log(`error: ${error.message}`);
        reject(error);
        return;
      }
    }
  });
}
