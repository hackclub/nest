import Slack from "@slack/bolt";

import ssh_keys_input from "../blocks/ssh_keys_input.js";
import { ssh_edit_view_ids } from "../util/ssh_edit_view_ids.js";

export function edit_ssh_keys(app: Slack.App) {
  app.action("edit_ssh_keys", async ({ ack, body, client }) => {
    ack();

    if (body.type !== "block_actions" || body.actions[0].type !== "button") {
      return;
    }

    const { view } = await client.views.open({
      trigger_id: body.trigger_id,
      view: await ssh_keys_input(body.actions[0].value),
    });

    if (view?.id) {
      ssh_edit_view_ids.set(body.actions[0].value, view.id);
    }
  });
}
