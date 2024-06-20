import Slack from "@slack/bolt";

import * as events from "./events/index.js";
import * as actions from "./actions/index.js";
import * as views from "./views/index.js";
import populate_users from "./util/populate_users.js";

import "dotenv/config";

const app = new Slack.App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
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

(async () => {
  await app.start(process.env.PORT ?? 3000);

  console.log("Nest Bot is running!");
})();
