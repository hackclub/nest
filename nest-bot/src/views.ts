export function approved_home(
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

export function unapproved_home(
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
          text: "Your Nest account is pending approval! Here's your profile:",
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
    ],
  };
}

export function unregistered_home() {
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
          text: "Hey there, I'm Nest Bot! I'll be helping you get started with Nest. Just provide your details and I'll help get you started!",
        },
      },
      {
        type: "divider",
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Register yourself!",
              emoji: true,
            },
            style: "primary",
            value: "register_user",
            action_id: "register_user",
          },
        ],
      },
    ],
  };
}
