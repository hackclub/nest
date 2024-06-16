import Slack from "@slack/bolt";

import { prisma } from "../util/prisma.js";

export function deny(app: Slack.App) {
  app.action("deny", async ({ ack, body, client }) => {
    ack();

    if (body.type !== "block_actions") {
      return;
    }

    const adminUserId = body.user.id;
    const nestUserId = body.state!.values.deny.deny.value!;

    const msgBlocks = body.message!.blocks;

    msgBlocks[2] = {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Denied by <@${adminUserId}>`,
      },
    };

    await client.chat.update({
      channel: body.container.channel_id,
      ts: body.container.message_ts,
      text: `Denied by <@${adminUserId}>`,
      blocks: msgBlocks,
    });

    await client.chat.postMessage({
      channel: nestUserId,
      text: `Your request for Nest has been denied. Please DM <@${adminUserId}> for more information.`,
    });

    await prisma.users.delete({
      where: {
        slack_user_id: nestUserId,
      },
    });
  });
}
