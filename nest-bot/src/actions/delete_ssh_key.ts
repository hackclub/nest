import Slack from "@slack/bolt";

import {
  get_authorized_keys,
  set_authorized_keys,
} from "../os/os_functions.js";
import ssh_keys_input from "../blocks/ssh_keys_input.js";

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
      view: await ssh_keys_input(user),
    });
  });
}
