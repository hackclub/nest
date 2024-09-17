import { prisma } from "./prisma.js";

export default async function populate_users() {
  const usersRes = await fetch(
    `https://identity.hackclub.app/api/v3/core/users/`,
    {
      headers: {
        Authorization: `Bearer ${process.env.AUTHENTIK_API_KEY}`,
      },
    },
  );

  if (!usersRes.ok) {
    console.error(
      `Failed to fetch users from Authentik (HTTP code ${usersRes.status})`,
    );
    return;
  }

  const users = (await usersRes.json()).results;
  const filteredUsers = users.filter(
    (user: any) =>
      user.groups.includes("c844feff-89b0-45cb-8204-8fc47afbd348") && // nest-users group
      user.is_active &&
      user.type === "internal" &&
      !user.groups.includes("2c756b31-2afa-4fbd-b011-b951529210d5"), // test-account group
  );

  const reqs = [];
  for (let i = 0; i < filteredUsers.length; i++) {
    const user = filteredUsers[i];
    const dbReq = prisma.users.create({
      data: {
        slack_user_id: i.toString(),
        name: user.name,
        email: user.email,
        tilde_username: user.username,
        description: "Added by populate_users function",
        is_approved: true,
      },
    });
    reqs.push(dbReq);
  }

  await Promise.all(reqs);
}
