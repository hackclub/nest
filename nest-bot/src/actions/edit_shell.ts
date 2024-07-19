import Slack from "@slack/bolt";

import shell_input from "../blocks/shell_input.js";

export function edit_shell(app: Slack.App) {
  app.action("edit_shell", async ({ ack, body, client }) => {
    ack();

    if (body.type !== "block_actions") {
      return;
    }

    await client.views.open({
      trigger_id: body.trigger_id,
      // @ts-expect-error - bolt types are wrong
      view: shell_input(body.actions[0].value),
    });
  });
}
