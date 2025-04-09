import Slack from "@slack/bolt";

import nominate_view from "../blocks/nominate.js";

export function nominate(app: Slack.App) {
  app.action("nominate", async ({ ack, body, client }) => {
    ack();

    if (body.type !== "block_actions" || body.actions[0].type !== "button") {
      return;
    }

    await client.views.open({
      trigger_id: body.trigger_id,
      view: nominate_view(body.actions[0].value!),
    });
  });
}
