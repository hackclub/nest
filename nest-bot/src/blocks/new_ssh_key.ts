export default function new_ssh_key(user: string) {
  return {
    type: "modal" as const,
    callback_id: "new_ssh_key",
    private_metadata: user,
    title: {
      type: "plain_text" as const,
      text: "New Nest SSH Key",
      emoji: true,
    },
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
    blocks: [
      {
        type: "input",
        block_id: "ssh_key_input",
        element: {
          type: "plain_text_input",
          action_id: "new_ssh_key",
        },
        label: {
          type: "plain_text",
          text: "Paste your SSH public key here:",
          emoji: true,
        },
      },
    ],
  };
}
