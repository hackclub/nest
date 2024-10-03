export default function full_name_input() {
  return {
    type: "modal" as const,
    callback_id: "edit_full_name",
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
          text: "Edit Full Name",
          emoji: true,
        },
      },
      {
        type: "input",
        block_id: "name_new",
        element: {
          type: "plain_text_input",
          action_id: "name_new_input",
        },
        label: {
          type: "plain_text",
          text: "New Name",
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
