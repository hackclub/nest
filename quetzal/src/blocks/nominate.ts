export default function nominate(election_id: string) {
  return {
    type: "modal" as const,
    callback_id: "nominate",
    private_metadata: election_id,
    title: {
      type: "plain_text" as const,
      text: "Nominate yourself",
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
        type: "section",
        text: {
          type: "plain_text",
          text: "You're about to nominate yourself for the Nest election!",
          emoji: true,
        },
      },
      {
        type: "input",
        block_id: "message_input",
        element: {
          type: "plain_text_input",
          multiline: true,
          action_id: "message",
          max_length: 200,
        },
        label: {
          type: "plain_text",
          text: "Message to voters",
          emoji: true,
        },
      },
    ],
  };
}
