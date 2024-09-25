module.exports = function ({ program, run }) {
  const db = program.command("db");

  db.command("create <name>")
    .description("Create a new Postgres database")
    .action(async (name) => {
      if (/^[A-Za-z0-9_-]+$/gi.test(name)!==true) {
        console.error(
          "Your database name can only include alphanumeric characters (a-Z, 0-9), hyphens (-), or underscores (_).",
        );
        process.exit(1);
      }
      var fetchRes=await fetch(`http://127.0.0.1:998/db/${require("os").userInfo().username}_${name}`, {
        method: "PUT"
      });
      switch(fetchRes.status) {
        case 200:
          console.log(`Successfully created database with name ${require("os").userInfo().username}_${name}`);
          break;
        default:
          var errMsg=await fetchRes.json();
          console.error(errMsg.message);
      }
    });
};
