import Slack from "@slack/bolt";

import new_verification_code_view from "../blocks/new_verification_code.js";

export function new_verification_code(app: Slack.App) {
  app.action("new_verification_code", async ({ ack, body, client }) => {
    ack();

    if (body.type !== "block_actions") {
      return;
    }

    await client.views.open({
      trigger_id: body.trigger_id,
      view: new_verification_code_view(),
    });
  });
}
