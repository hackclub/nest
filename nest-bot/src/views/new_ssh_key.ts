import Slack from "@slack/bolt";
import sshpk from "sshpk";
import {
  set_authorized_keys,
  get_authorized_keys,
} from "../os/os_functions.js";
import ssh_keys_input from "../blocks/ssh_keys_input.js";
import { ssh_edit_view_ids } from "../util/ssh_edit_view_ids.js";

export function new_ssh_key(app: Slack.App) {
  app.view("new_ssh_key", async ({ ack, body, view, client }) => {
    const ssh_key = view.state.values.ssh_key_input.new_ssh_key.value ?? "";
    const user = view.private_metadata;

    // SSH key validation
    let key: sshpk.Key;
    try {
      key = sshpk.parseKey(ssh_key);
    } catch {
      ack({
        errors: {
          ssh_key: "Invalid SSH key",
        },
        response_action: "errors",
      });
      return;
    }

    // @ts-expect-error
    if (sshpk.Key.isKey(key) === false) {
      ack({
        errors: {
          ssh_key: "Invalid SSH key",
        },
        response_action: "errors",
      });
      return;
    }

    ack();

    const keys = await get_authorized_keys(user);

    set_authorized_keys(user, [...keys, key.toString("ssh")]);

    await client.views.update({
      view_id: ssh_edit_view_ids.get(user),
      view: await ssh_keys_input(user),
    });
  });
}
