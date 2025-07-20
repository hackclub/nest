export default function verification_required() {
  return {
    type: "modal" as const,
    callback_id: "submit_code",
    title: {
      type: "plain_text" as const,
      text: "Verification Required",
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
          type: "mrkdwn",
          text: "Before you can sign up for Nest, you'll need to verify that you are a student with Hack Club. Please go to https://identity.hackclub.com to start.\n\n_Note that this form is processed by Hack Club HQ (not Nest), so if you have any questions about how to complete it, please email team@hackclub.com. It may take a while for the team to process your submission._",
        },
      },
      {
        type: "input",
        block_id: "code",
        element: {
          type: "plain_text_input",
          action_id: "code_input",
        },
        label: {
          type: "plain_text",
          text: "Or, if you have a verification code, enter it here:",
          emoji: true,
        },
      },
    ],
  };
}
