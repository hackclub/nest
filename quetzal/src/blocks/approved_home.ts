import { prisma } from "../util/prisma.js";
import type { codes, users } from "@prisma/client";

export default async function approved_home(
  id: number,
  name: string,
  username: string,
  email: string,
  shell: string,
  admin: boolean,
) {
  let verification_codes: (codes & {
    generated_by: users;
  })[] = [];
  if (admin) {
    verification_codes = await prisma.codes.findMany({
      where: {
        valid: true,
        OR: [
          {
            expiry: { gt: new Date() },
          },
          {
            expiry: null,
          },
        ],
      },
      include: {
        generated_by: true,
      },
    });
  }

  return {
    type: "home" as const,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "Quetzal",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Welcome to Nest! Here's your profile - if you have any questions, ask in the #nest channel!",
        },
      },
      {
        type: "divider",
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Nest Username:* ${username}`,
        },
      },
      {
        type: "divider",
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Full Name:* ${name}`,
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "Edit",
            emoji: true,
          },
          value: "edit_full_name",
          action_id: "edit_full_name",
        },
      },
      {
        type: "divider",
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Email:* ${email}`,
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "Edit",
            emoji: true,
          },
          value: "edit_email",
          action_id: "edit_email",
        },
      },
      {
        type: "divider",
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Your SSH public keys*",
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "Edit",
            emoji: true,
          },
          value: username,
          action_id: "edit_ssh_keys",
        },
      },
      {
        type: "divider",
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Current Shell:* \`${shell}\``,
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "Edit",
            emoji: true,
          },
          value: shell,
          action_id: "edit_shell",
        },
      },
      ...(admin
        ? [
            {
              type: "divider",
            },
            {
              type: "header",
              text: {
                type: "plain_text",
                text: "Verification Codes",
              },
            },
            ...verification_codes.map((code) => ({
              type: "section",
              text: {
                type: "mrkdwn",
                text: `${code.oneTime ? "1️⃣ " : ""}Code \`${code.code}\` generated on ${code.generated_on.toLocaleDateString()} by <@${code.generated_by.slack_user_id}>. ${code.expiry !== null ? `Expiring on ${code.expiry.toLocaleString()}.` : ""}`,
              },
              accessory: {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Invalidate code",
                  emoji: true,
                },
                value: code.id.toString(),
                action_id: "invalidate_code",
              },
            })),
            {
              type: "actions",
              elements: [
                {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "New verification code",
                  },
                  action_id: "new_verification_code",
                },
              ],
            },
          ]
        : []),
    ],
  };
}
