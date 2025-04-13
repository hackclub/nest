import Slack from "@slack/bolt";

import new_election_view from "../blocks/new_election.js";

export function new_election(app: Slack.App) {
  app.action("new_election", async ({ ack, body, client }) => {
    ack();

    if (body.type !== "block_actions") {
      return;
    }

    await client.views.open({
      trigger_id: body.trigger_id,
      view: new_election_view(),
    });
  });
}
