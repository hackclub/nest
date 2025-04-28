import Slack from "@slack/bolt";

import vote_view from "../blocks/vote.js";

export function vote(app: Slack.App) {
  app.action("vote", async ({ ack, body, client }) => {
    ack();

    if (body.type !== "block_actions" || body.actions[0].type !== "button") {
      return;
    }

    await client.views.open({
      trigger_id: body.trigger_id,
      view: await vote_view(body.actions[0].value!, body.user.id),
    });
  });
}
