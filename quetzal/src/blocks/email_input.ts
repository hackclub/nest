export default function email_input() {
  return {
    type: "modal" as const,
    callback_id: "edit_email",
    title: {
      type: "plain_text" as const,
      text: "Quetzal",
      emoji: true,
    },
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "Edit Email",
          emoji: true,
        },
      },
      {
        type: "input",
        block_id: "email_new",
        element: {
          type: "plain_text_input",
          action_id: "email_new_input",
        },
        label: {
          type: "plain_text",
          text: "New Email",
          emoji: true,
        },
      },
    ],
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
  };
}
