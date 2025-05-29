import Slack from "@slack/bolt";

import { prisma } from "../util/prisma.js";

import approved_home from "../blocks/approved_home.js";
import unapproved_home from "../blocks/unapproved_home.js";
import unregistered_home from "../blocks/unregistered_home.js";

import get_user_shell from "../os/get_user_shell.js";

export async function app_home_opened(app: Slack.App) {
  app.event("app_home_opened", async ({ event, client }) => {
    const user = event.user;
    const {
      id,
      name,
      is_approved,
      email,
      ssh_public_key,
      tilde_username,
      admin,
    } =
      (await prisma.users.findUnique({
        where: {
          slack_user_id: user,
        },
        select: {
          id: true,
          tilde_username: true,
          name: true,
          is_approved: true,
          ssh_public_key: true,
          email: true,
          admin: true,
        },
      })) ?? {};

    const shell = await get_user_shell(tilde_username!);

    if (name && is_approved) {
      await client.views.publish({
        user_id: user,
        view: await approved_home(id!, name, tilde_username!, email!, shell),
      });
    } else if (name && !is_approved) {
      await client.views.publish({
        user_id: user,
        view: await unapproved_home(
          name,
          tilde_username!,
          email!,
          ssh_public_key!,
        ),
      });
    } else {
      await client.views.publish({
        user_id: user,
        view: unregistered_home(),
      });
    }
  });
}
