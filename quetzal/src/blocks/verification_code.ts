export default function verification_code(code: string) {
  return {
    type: "modal" as const,
    title: {
      type: "plain_text" as const,
      text: "Verification Code",
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
          text: `Your new verification code is: ${code}`,
        },
      },
    ],
  };
}
