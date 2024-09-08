module.exports = function ({ program, run }) {
    const db = program.command("db")

    db
        .command('create <name>')
        .description('Create a new Postgres database')
        .action((name) => {
            if (/[^a-z0-9]/gi.test(name)) {
                console.error("Your database name can only include alphanumeric characters (a-Z, 0-9)")
                process.exit(1)
            }
            run(`sudo -u postgres /usr/local/nest/cli/helpers/create_db.sh ${name}`);
        });
}