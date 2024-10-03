export default function unregistered_home() {
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
          text: "Hey there, I'm Quetzal! I'll be helping you get started with Nest. Just provide your details and I'll help get you started! If you have any questions, ask in the #nest channel.",
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
