import Slack from "@slack/bolt";

import new_ssh_key from "../blocks/new_ssh_key.js";

export function add_ssh_key(app: Slack.App) {
  app.action("add_ssh_key", async ({ ack, body, client }) => {
    ack();

    if (body.type !== "block_actions" || body.actions[0].type !== "button") {
      return;
    }

    await client.views.push({
      trigger_id: body.trigger_id,
      view: new_ssh_key(body.actions[0].value),
    });
  });
}
