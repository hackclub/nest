import postgres from "postgres";

const sql = postgres({
  host: "/var/run/postgresql",
  database: "postfix-manager",
  debug: function (...args) {
    console.log(args);
  },
});

export default sql;
