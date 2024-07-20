import getShells from "../util/get_shells.js";

(async () => {
    const shells = await getShells("/bin/bash", "src/tests/shells");
    const properShells = ["/bin/sh", "/bin/bash", "/bin/rbash", "/bin/dash", "/usr/bin/tmux", "/bin/zsh", "/bin/csh",
        "/bin/ksh93", "/bin/rksh93", "/usr/bin/fish", "/bin/tcsh", "/usr/bin/screen"
    ];
    console.log("gotten shells", shells);
    console.log("proper shells", properShells);

    console.log("\n---\n")

    const isMatch = shells.every(shell => properShells.includes(shell));
    console.log(`The shell filtering is a match? ${isMatch ? '\x1b[32mtrue! 🎉' : '\x1b[31mfalse :('}\x1b[0m`);

    console.log("\n---")
})();
