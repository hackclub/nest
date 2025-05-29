import Slack from "@slack/bolt";

import { prisma } from "../util/prisma.js";
import approved_home from "../blocks/approved_home.js";
import get_user_shell from "../os/get_user_shell.js";

export function edit_email(app: Slack.App) {
  app.view("edit_email", async ({ ack, body, view, client }) => {
    const email = view.state.values.email_new.email_new_input.value;

    if (
      email &&
      !email.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/)
    ) {
      ack({
        response_action: "errors",
        errors: {
          email_new: "Invalid email.",
        },
      });
      return;
    }

    ack();

    const user = await prisma.users.update({
      where: {
        slack_user_id: body.user.id,
      },
      data: {
        email,
      },
    });

    const shell = await get_user_shell(user.tilde_username!);

    await client.views.publish({
      user_id: body.user.id,
      view: await approved_home(
        user.id,
        user.name!,
        user.tilde_username,
        user.email!,
        shell,
      ),
    });
  });
}
