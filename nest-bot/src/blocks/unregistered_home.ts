export default function unregistered_home() {
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
