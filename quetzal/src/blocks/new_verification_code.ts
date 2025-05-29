export default function new_verification_code(user: string) {
  return {
    type: "modal" as const,
    callback_id: "new_verification_code",
    private_metadata: user,
    title: {
      type: "plain_text" as const,
      text: "New Verification Code",
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
          text: "Generate a new verification code for a user to sign up with!",
          emoji: true,
        },
      },
      {
        type: "input",
        block_id: "one_time",
        element: {
          type: "radio_buttons",
          options: [
            {
              text: {
                type: "plain_text",
                text: "Yes",
                emoji: true,
              },
              value: "yes",
            },
            {
              text: {
                type: "plain_text",
                text: "No",
                emoji: true,
              },
              value: "no",
            },
          ],
          action_id: "one_time_input",
        },
        label: {
          type: "plain_text",
          text: "One time use?",
          emoji: true,
        },
      },
      {
        type: "input",
        block_id: "expiry",
        element: {
          type: "datetimepicker",
          action_id: "expiry_input",
        },
        label: {
          type: "plain_text",
          text: "Expiry? (leave blank to never expire)",
          emoji: true,
        },
        optional: true,
      },
    ],
  };
}
