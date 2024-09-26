import postgres from 'postgres'

const sql = postgres({
    host: "/var/run/postgresql",
    debug: function(...args) {
        console.log(args);
    }
});

export default sql