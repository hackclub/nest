import sshpk from "sshpk";
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
      ...keys.map((keyText) => {
        let prettyKey;
        try {
          let key = sshpk.parseKey(keyText);
          // @ts-expect-error
          if (sshpk.Key.isKey(key) === false) {
            prettyKey = `\`${keyText.substring(0, 9)}...${keyText.substring(keyText.length - 9, keyText.length)}\``;
          } else {
            const [type, data, ...comment] = key.toString("ssh").split(" ");
            prettyKey = `\`${type} ${data.substring(0, 9)}...${data.substring(data.length - 9, data.length)} ${comment.join(" ")}\``;
          }
        } catch {
          prettyKey = `${keyText.substring(0, 9)}...${keyText.substring(keyText.length - 9, keyText.length)}`;
        }

        return {
          type: "section",
          text: {
            type: "mrkdwn",
            text: prettyKey,
          },
          accessory: {
            type: "button",
            text: {
              type: "plain_text",
              text: "Delete key",
              emoji: true,
            },
            style: "danger",
            value: JSON.stringify({ user, ssh_key: keyText }),
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
