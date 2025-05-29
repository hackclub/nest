import Slack from "@slack/bolt";

import { prisma } from "../util/prisma.js";
import approved_home from "../blocks/approved_home.js";
import get_user_shell from "../os/get_user_shell.js";

export function invalidate_code(app: Slack.App) {
  app.action("invalidate_code", async ({ ack, body, client }) => {
    ack();

    if (body.type !== "block_actions" || body.actions[0].type !== "button") {
      return;
    }

    const user = await prisma.users.findFirst({
      where: {
        slack_user_id: body.user.id,
      },
    });

    if (!user?.admin) return;

    await prisma.codes.update({
      where: {
        id: Number(body.actions[0].value!),
      },
      data: {
        valid: false,
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
        user.admin,
      ),
    });
  });
}
