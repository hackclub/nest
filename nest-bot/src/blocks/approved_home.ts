export default function approved_home(
  name: string,
  username: string,
  email: string,
  ssh_key: string
) {
  return {
    type: "home" as const,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "Nest Bot",
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
          text: `*SSH Public Key:* \`${ssh_key}\``,
        },
      },
      {
        type: "divider",
      },
    ],
  };
}
