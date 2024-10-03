import Slack from "@slack/bolt";
import { randomBytes } from "crypto";

import { prisma } from "../util/prisma.js";
import {
  add_root_caddyfile_config,
  setup_script,
  home_script,
  set_authorized_keys,
} from "../os/os_functions.js";
import markdown_message from "../blocks/markdown_message.js";

export function approve(app: Slack.App) {
  app.action("approve", async ({ ack, body, client }) => {
    ack();

    if (body.type !== "block_actions" || body.actions[0].type !== "button") {
      return;
    }

    const adminUserId = body.user.id;
    const nestUserId = body.actions[0].value;

    const msgBlocks = body.message!.blocks;
    msgBlocks[2] = {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Approved by <@${adminUserId}>`,
      },
    };

    await client.chat.update({
      channel: body.container.channel_id,
      ts: body.container.message_ts,
      text: `Approved by <@${adminUserId}>`,
      blocks: msgBlocks,
    });

    // Create user in Authentik

    const user = await prisma.users.findUnique({
      where: {
        slack_user_id: nestUserId,
      },
    });
    const username = user?.tilde_username!;

    const password = randomBytes(20).toString("base64url");

    const createRes = await fetch(
      "https://identity.hackclub.app/api/v3/core/users/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.AUTHENTIK_API_KEY}`,
        },
        body: JSON.stringify({
          username,
          name: user?.name,
          email: user?.email,
          is_active: true,
          path: "users",
          groups: ["c844feff-89b0-45cb-8204-8fc47afbd348"], // nest-users group
          type: "internal",
        }),
      },
    );

    if (!createRes.ok) {
      console.error(
        `Failed to create user ${username} in Authentik (HTTP code ${createRes.status})`,
      );
      return;
    }

    console.log(`User ${username} created in Authentik`);

    const pk = (await createRes.json()).pk;

    const passwordRes = await fetch(
      `https://identity.hackclub.app/api/v3/core/users/${pk}/set_password/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.AUTHENTIK_API_KEY}`,
        },
        body: JSON.stringify({
          password,
        }),
      },
    );

    if (!passwordRes.ok) {
      console.error(
        `Failed to set password for user ${username} in Authentik (HTTP code ${passwordRes.status})`,
      );
      return;
    }

    console.log(`Password set for ${username}`);

    // Delay 6 minutes to allow time for caching
    await new Promise((resolve) => setTimeout(resolve, 1000 * 60 * 6));

    await client.chat.postMessage({
      channel: nestUserId,
      text: "Your request for Nest has been approved!",
    });

    await client.chat.postMessage({
      channel: nestUserId,
      blocks: markdown_message(
        `Your password for your Nest account is \`${password}\`. Please continue through our Quickstart guide at https://guides.hackclub.app/index.php/Quickstart#Creating_an_Account.`,
      ),
      text: `Your password for your Nest account is ${password}. Please continue through our Quickstart guide at https://guides.hackclub.app/index.php/Quickstart#Creating_an_Account.`,
    });

    const userGroup = await client.usergroups.users.list({
      usergroup: "S05RNTN07SN", // @birds group
    });

    await client.usergroups.users.update({
      usergroup: "S05RNTN07SN", // @birds group
      users: [...(userGroup.users ?? []), nestUserId].join(","),
    });

    // Initialize user on Nest VM
    await setup_script(username);
    await home_script(username);
    await add_root_caddyfile_config(username);
    await set_authorized_keys(username, [user!.ssh_public_key]);

    console.log(`User ${username} initialized on Nest VM`);

    // Mark user as approved in database

    await prisma.users.update({
      where: {
        slack_user_id: nestUserId,
      },
      data: {
        is_approved: true,
        pk,
      },
    });
  });
}
