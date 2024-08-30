import getShells from "../os/get_shells.js";

export default async function shell_input(shell: string) {
  const shells = await getShells(shell);

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
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Select a new shell for your account. Note that it may take up to 5 minutes for the changes to take effect after submitting.",
        },
      },
      {
        type: "input",
        block_id: "shell_new",
        element: {
          type: "static_select",
          action_id: "shell_new_input",
          placeholder: {
            type: "plain_text",
            text: shell,
            emoji: true
          },
          options: [
            {
              text: {
                type: "plain_text",
                text: shell,
                emoji: true
              },
              value: shell,
            },
            ...shells.map(shell => ({
              text: {
                type: "plain_text",
                text: shell,
                emoji: true
              },
              value: shell,
            })),
          ],
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
