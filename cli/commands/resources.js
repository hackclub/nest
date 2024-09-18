const fs = require("node:fs");

module.exports = function ({ program, run }) {
  program
    .command("resources")
    .description("See your Nest resource usage and limits")
    .action(() => {
      if (!process.getuid()) {
        console.log("Root doesn't have any limits.");
        process.exit(0);
      }
      const output = run(`quota`).toString();
      const numbers = output
        .split("\n")
        .find((line) => line.includes("/dev/sda"))
        .match(/\d+/g);
      const array = numbers.map(Number);
      const blockSize = 1024;

      const usedGB = (array[1] * blockSize) / 1024 ** 3;
      const quotaGB = (array[2] * blockSize) / 1024 ** 3;

      console.log(
        `Disk usage: ${usedGB.toFixed(2)} GB used out of ${quotaGB.toFixed(2)} GB limit`,
      );

      const userId = process.getuid();
      const memoryUsage = (
        parseFloat(
          fs.readFileSync(
            `/sys/fs/cgroup/user.slice/user-${userId}.slice/memory.current`,
          ),
        ) /
        (1024 * 1024 * 1024)
      ).toFixed(2);
      const memoryLimit = (
        parseFloat(
          fs.readFileSync(
            `/sys/fs/cgroup/user.slice/user-${userId}.slice/memory.high`,
          ),
        ) /
        (1024 * 1024 * 1024)
      ).toFixed(2);
      console.log(
        `Memory usage: ${memoryUsage} GB used out of ${memoryLimit} GB limit`,
      );
    });
};
