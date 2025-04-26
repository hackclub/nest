import Slack from "@slack/bolt";

import { prisma } from "../util/prisma.js";
import approved_home from "../blocks/approved_home.js";

export function edit_shell(app: Slack.App) {
  app.view("edit_shell", async ({ ack, body, view, client }) => {
    const shell =
      view.state.values.shell_new.shell_new_input.selected_option?.value;

    // shell validation for stuff like /bin/bash or /bin/zsh
    if (!shell) {
      ack({
        response_action: "errors",
        errors: {
          email_new: "Invalid shell.",
        },
      });
      return;
    }

    ack();

    const { id, name, email, tilde_username, pk, admin } =
      (await prisma.users.findUnique({
        where: {
          slack_user_id: body.user.id,
        },
        select: {
          id: true,
          tilde_username: true,
          name: true,
          is_approved: true,
          email: true,
          pk: true,
          admin: true,
        },
      })) ?? {};

    // get groups of user
    const userRes = await fetch(
      `https://identity.hackclub.app/api/v3/core/users/${pk}/`,
      {
        headers: {
          Authorization: `Bearer ${process.env.AUTHENTIK_API_KEY}`,
        },
      },
    );
    const userJson = await userRes.json();

    // update the user's shell
    const updateRes = await fetch(
      `https://identity.hackclub.app/api/v3/core/users/${pk}/`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.AUTHENTIK_API_KEY}`,
        },
        body: JSON.stringify({
          username: tilde_username,
          name,
          groups: userJson.groups,
          attributes: {
            ...userJson.attributes,
            loginShell: shell,
          },
        }),
      },
    );

    if (!updateRes.ok) {
      console.error(
        `Failed to update user ${tilde_username}'s shell "${shell}" in Authentik (HTTP code ${updateRes.status})`,
      );
      return;
    }

    const userInfo = await client.users.info({
      user: body.user.id,
    });

    await client.views.publish({
      user_id: body.user.id,
      view: await approved_home(
        id!,
        name!,
        tilde_username!,
        email!,
        shell!,
        admin!,
        userInfo.user?.tz!,
      ),
    });
  });
}
