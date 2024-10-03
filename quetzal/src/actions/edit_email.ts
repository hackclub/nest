import Slack from "@slack/bolt";

import email_input from "../blocks/email_input.js";

export function edit_email(app: Slack.App) {
  app.action("edit_email", async ({ ack, body, client }) => {
    ack();

    if (body.type !== "block_actions") {
      return;
    }

    await client.views.open({
      trigger_id: body.trigger_id,
      view: email_input(),
    });
  });
}
