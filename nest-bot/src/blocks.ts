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

export function register_user(profile_name: string) {
  return {
    callback_id: "register_user",
    type: "modal" as const,
    submit: {
      type: "plain_text" as const,
      text: "Submit",
      emoji: true,
    },
    close: {
      type: "plain_text" as const,
      text: "Cancel",
      emoji: true,
    },
    title: {
      type: "plain_text" as const,
      text: "Register for Nest",
      emoji: true,
    },
    blocks: [
      {
        type: "section",
        text: {
          type: "plain_text",
          text: `:wave: Hey ${profile_name}!\n\nPlease enter the required details to register for Nest!`,
          emoji: true,
        },
      },
      {
        type: "divider",
      },
      {
        type: "input",
        block_id: "username",
        label: {
          type: "plain_text",
          text: "Nest username? (This will be your subdomain)",
          emoji: true,
        },
        element: {
          type: "plain_text_input",
          action_id: "username_input",
        },
      },
      {
        type: "input",
        block_id: "name",
        label: {
          type: "plain_text",
          text: "Full name?",
          emoji: true,
        },
        element: {
          type: "plain_text_input",
          action_id: "name_input",
        },
      },
      {
        type: "input",
        block_id: "email",
        label: {
          type: "plain_text",
          text: "Email?",
          emoji: true,
        },
        element: {
          type: "plain_text_input",
          action_id: "email_input",
        },
      },
      {
        type: "input",
        block_id: "ssh_key",
        label: {
          type: "plain_text",
          text: "Public SSH key?",
          emoji: true,
        },
        element: {
          type: "plain_text_input",
          action_id: "ssh_key_input",
          multiline: true,
        },
      },
      {
        type: "input",
        block_id: "description",
        label: {
          type: "plain_text",
          text: "What do you plan to use Nest for?",
          emoji: true,
        },
        element: {
          type: "plain_text_input",
          action_id: "description_input",
          multiline: true,
        },
      },
    ],
  };
}

export function approval_message(
  slack_user: string,
  name: string,
  username: string,
  email: string,
  ssh_key: string,
  description: string
) {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `You have a new request from <@${slack_user}>`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Full Name:*\n${name}\n*Username:*\n${username}\n*Email:* ${email}\n*SSH Public Key:* \`${ssh_key}\`\n*Description:* ${description}`,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            emoji: true,
            text: "Approve",
          },
          style: "primary",
          value: "approve",
          action_id: "approve_action",
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            emoji: true,
            text: "Deny",
          },
          style: "danger",
          value: "deny",
          action_id: "deny_action",
        },
      ],
    },
  ];
}
