import Slack from "@slack/bolt";
import { PrismaClient } from "@prisma/client";

import { approved_home, unapproved_home, unregistered_home } from "./views.js";

import "dotenv/config";

const app = new Slack.App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

const prisma = new PrismaClient();

app.event("app_home_opened", async ({ event, client }) => {
  const user = event.user;
  const { name, is_approved, email, ssh_public_key, tilde_username } =
    (await prisma.users.findUnique({
      where: {
        slack_user_id: user,
      },
      select: {
        tilde_username: true,
        name: true,
        is_approved: true,
        ssh_public_key: true,
        email: true,
      },
    })) ?? {};

  if (name && is_approved) {
    await client.views.publish({
      user_id: user,
      view: approved_home(name, tilde_username!, email!, ssh_public_key!),
    });
  } else if (name && !is_approved) {
    await client.views.publish({
      user_id: user,
      view: unapproved_home(name, tilde_username!, email!, ssh_public_key!),
    });
  } else {
    await client.views.publish({
      user_id: user,
      view: unregistered_home(),
    });
  }
});

(async () => {
  await app.start();

  console.log("⚡️ Bolt app is running!");
})();
