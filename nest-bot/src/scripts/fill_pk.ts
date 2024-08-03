import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

(async () => {
	const users = await prisma.users.findMany();

	for (const user of users) {
		const pkReq = await fetch(`https://identity.hackclub.app/api/v3/core/users/?username=${encodeURIComponent(user.tilde_username!)}`, {
			headers: {
				Authorization: `Bearer ${process.env.AUTHENTIK_API_KEY}`,
			},
		});

		if (!pkReq.ok) {
			console.error(`Failed to get user ${user.email} in Authentik (HTTP code ${pkReq.status})`);
			continue;
		}

		const pkJson = await pkReq.json();
		if (pkJson.results.length === 0) {
			console.error(`User ${user.tilde_username} not found in Authentik`);
			continue
		}
		const pk = pkJson.results[0].pk;

		await prisma.users.update({
			where: {
				slack_user_id: user.slack_user_id
			},
			data: {
				pk
			}
		});

		console.log(`User ${user.tilde_username} updated with pk ${pk}`);
	}
})();
