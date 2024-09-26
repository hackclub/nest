const net = require("node:net");

module.exports = function ({ program, run }) {
  program
    .command("get_port")
    .description("Get an open port to use for your app")
    .action(() => {
      const server = net.createServer();
      server.listen(0, "127.0.0.1", () => {
        const port = server.address().port;
        console.log(`Port ${port} is free to use!`);
        server.close();
      });
    });
};
