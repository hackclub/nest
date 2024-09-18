module.exports = function ({ program }) {
    const caddy = program.command("caddy")
    caddy
        .command('list')
        .description('lists all domains you have configured in caddy')
        .option('--user [user]', 'allows you to add a domain on behalf of a user (requires sudo)')
        .action(async (options) => {
            const domainsRes = await fetch(`http://localhost:999/list${options.user ? `?impersonateUser=${options.user}` : ""}`);

            if (domainsRes.status !== 200) {
              console.error(await domainsRes.text() || domainsRes.statusText)
              process.exit(1);
            } else {
              console.log(await domainsRes.text())
            }
        });
    caddy
        .command('add <domain>')
        .description('adds a domain to caddy')
        .option('--proxy [proxy]', 'changes where the domain should be proxied to (advanced)')
        .option('--user [user]', "allows you to list a different user's domains (requires sudo)")
        .action(async (domain, options) => {
          const addRes = await fetch(`http://localhost:999/domain/new${options.user ? `?impersonateUser=${options.user}` : ""}`, {
            method: "POST",
            body: JSON.stringify({
              domain,
              proxy: options?.proxy
            })
          });

          if (addRes.status !== 200) {
            console.error(await addRes.text() || addRes.statusText)
            process.exit(1);
          } else {
            console.log(await addRes.text())
          }
        });
    caddy
        .command('rm <domain>')
        .description('removes a domain from caddy')
        .option('--user [user]', 'allows you to add a domain on behalf of a user (requires sudo)')
        .action(async (domain, options) => {
          const removeRes = await fetch(`http://localhost:999/domain/delete${options.user ? `?impersonateUser=${options.user}` : ""}`, {
            method: "POST",
            body: JSON.stringify({
              domain
            })
          });

          if (removeRes.status !== 200) {
            console.error(await removeRes.text() || removeRes.statusText)
            process.exit(1);
          } else {
            console.log(await removeRes.text())
          }
        });
    caddy
        .command('reload')
        .description('reloads the global caddy instance (admins only)')
        .action(async () => {
            const reloadRes = await fetch(`http://localhost:999/reload${options.user ? `?impersonateUser=${options.user}` : ""}`, {
              method: "POST",
            });

            if (reloadRes.status !== 200) {
              console.error(await reloadRes.text() || reloadRes.statusText)
              process.exit(1);
            } else {
              console.log(await reloadRes.text())
            }
        });
}