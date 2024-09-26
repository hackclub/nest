import Slack from "@slack/bolt";

import {
  get_authorized_keys,
  set_authorized_keys,
} from "../os/os_functions.js";
import ssh_keys_view from "../blocks/ssh_keys_view.js";
import { ssh_edit_view_ids } from "../util/ssh_edit_view_ids.js";

export function delete_ssh_key(app: Slack.App) {
  app.action("delete_ssh_key", async ({ ack, body, client }) => {
    ack();

    if (body.type !== "block_actions" || body.actions[0].type !== "button") {
      return;
    }

    const { user, ssh_key } = JSON.parse(body.actions[0].value);

    const keys = await get_authorized_keys(user);

    set_authorized_keys(
      user,
      keys.filter((k) => k !== ssh_key),
    );

    await client.views.update({
      trigger_id: body.trigger_id,
      view_id: ssh_edit_view_ids.get(user),
      view: await ssh_keys_view(user),
    });
  });
}
