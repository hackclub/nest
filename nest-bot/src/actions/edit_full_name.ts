import Slack from "@slack/bolt";

import full_name_input from "../blocks/full_name_input.js";

export function edit_full_name(app: Slack.App) {
  app.action("edit_full_name", async ({ ack, body, client }) => {
    ack();

    if (body.type !== "block_actions") {
      return;
    }

    await client.views.open({
      trigger_id: body.trigger_id,
      view: full_name_input(),
    });
  });
}
