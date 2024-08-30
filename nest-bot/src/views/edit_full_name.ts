import Slack from "@slack/bolt";

import { prisma } from "../util/prisma.js";
import approved_home from "../blocks/approved_home.js";
import get_user_shell from "../os/get_user_shell.js";

export function edit_full_name(app: Slack.App) {
  app.view("edit_full_name", async ({ ack, body, view, client }) => {
    ack();

    const user = await prisma.users.update({
      where: {
        slack_user_id: body.user.id,
      },
      data: {
        name: view.state.values.name_new.name_new_input.value,
      },
    });

    const shell = await get_user_shell(user.tilde_username!);

    await client.views.publish({
      user_id: body.user.id,
      view: approved_home(
        user.name!,
        user.tilde_username,
        user.email!,
        user.ssh_public_key,
        shell,
      ),
    });
  });
}
