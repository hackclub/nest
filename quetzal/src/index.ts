import Slack from "@slack/bolt";

import * as events from "./events/index.js";
import * as actions from "./actions/index.js";
import * as views from "./views/index.js";
import populate_users from "./util/populate_users.js";
import { prisma } from "./util/prisma.js";

import "dotenv/config";

const expressReceiver = new Slack.ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET!,
});
const app = new Slack.App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: expressReceiver,
});
expressReceiver.app.get("/status", (req, res) => {
  res.status(200).send();
});

for (const [name, event] of Object.entries(events)) {
  event(app);
  console.log(`Registered event: ${name}`);
}

for (const [name, action] of Object.entries(actions)) {
  action(app);
  console.log(`Registered action: ${name}`);
}

for (const [name, view] of Object.entries(views)) {
  view(app);
  console.log(`Registered view: ${name}`);
}

if (process.env.POPULATE_USERS === "true") {
  populate_users();
}

// Reminder for forgotten approvals
setInterval(
  async () => {
    const users = await prisma.users.findMany({
      where: {
        is_approved: null,
      },
    });

    for (const user of users) {
      if (user.message_id) {
        app.client.chat.postMessage({
          channel: "C05VBD1B7V4",
          reply_broadcast: true,
          thread_ts: user.message_id,
          text: `Reminder: @${user.slack_user_id} is waiting on a response!`,
        });
      } else {
        app.client.chat.postMessage({
          channel: "C05VBD1B7V4",
          text: `Reminder: @${user.slack_user_id} is waiting on a response!`,
        });
      }
    }
  },
  24 * 60 * 60 * 1000, // every 24 hours
);

(async () => {
  await app.start(process.env.PORT ?? 3000);

  console.log("Quetzal is running!");
})();
