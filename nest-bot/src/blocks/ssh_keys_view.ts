import { get_authorized_keys } from "../os/os_functions.js";

export default async function ssh_keys_view(user: string) {
  const keys = await get_authorized_keys(user);

  return {
    type: "modal" as const,
    title: {
      type: "plain_text" as const,
      text: "Nest SSH Keys",
      emoji: true,
    },
    submit: {
      type: "plain_text" as const,
      text: "Done",
      emoji: true,
    },
    close: {
      type: "plain_text" as const,
      text: "Cancel",
      emoji: true,
    },
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `These are the SSH public keys that are authorized to access your account:`,
        },
      },
      {
        type: "divider",
      },
      ...keys.map((key) => {
        const [type, data, ...comment] = key.split(" ");
        return {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `\`${type} ${data.substring(0, 9)}...${data.substring(data.length - 9, data.length)} ${comment.join(" ")}\``,
          },
          accessory: {
            type: "button",
            text: {
              type: "plain_text",
              text: "Delete key",
              emoji: true,
            },
            style: "danger",
            value: JSON.stringify({ user, ssh_key: key }),
            action_id: "delete_ssh_key",
          },
        };
      }),
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Add key",
              emoji: true,
            },
            value: user,
            action_id: "add_ssh_key",
          },
        ],
      },
    ],
  };
}
