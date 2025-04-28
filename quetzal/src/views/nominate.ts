import Slack from "@slack/bolt";

import { prisma } from "../util/prisma.js";
import approved_home from "../blocks/approved_home.js";
import get_user_shell from "../os/get_user_shell.js";

export function nominate(app: Slack.App) {
  app.view("nominate", async ({ ack, body, view, client }) => {
    const user = await prisma.users.findFirst({
      where: {
        slack_user_id: body.user.id,
      },
    });

    if (!user) return;
    ack();

    const message = view.state.values.message_input.message.value!.toString();
    const electionId = parseInt(view.private_metadata);

    await prisma.nominees.create({
      data: {
        message,
        usersId: user.id,
        electionsId: electionId,
      },
    });

    const shell = await get_user_shell(user.tilde_username!);

    const userInfo = await client.users.info({
      user: body.user.id,
    });

    await client.views.publish({
      user_id: body.user.id,
      view: await approved_home(
        user.id,
        user.name!,
        user.tilde_username,
        user.email!,
        shell,
        user.admin,
        userInfo.user?.tz!,
      ),
    });
  });
}
