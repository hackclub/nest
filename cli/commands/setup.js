module.exports = function ({ program, run }) {
  const setup = program.command("setup");
  setup
    .command("docker")
    .description("Set up rootless docker, so you can run docker containers")
    .action(() => {
      run("dockerd-rootless-setuptool.sh install");
      run(
        `sed -i '/^ExecStart/ s/$/ --exec-opt native.cgroupdriver=cgroupfs /' ~/.config/systemd/user/docker.service`,
      );
      run("systemctl --user daemon-reload");
      run("systemctl --user enable docker");
      run("systemctl --user restart docker");
      run("docker context use rootless");
      console.log("Successfully configured docker.");
    });
};
