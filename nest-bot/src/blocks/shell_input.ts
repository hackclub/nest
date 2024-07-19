export default function email_input() {
  return {
    type: "modal" as const,
    callback_id: "edit_shell",
    title: {
      type: "plain_text" as const,
      text: "Nest Bot",
      emoji: true,
    },
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "Edit Shell",
          emoji: true,
        },
      },
      {
        type: "input",
        block_id: "shell_new",
        element: {
          type: "plain_text_input",
          action_id: "shell_new_input",
        },
        label: {
          type: "plain_text",
          text: "New Shell",
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
