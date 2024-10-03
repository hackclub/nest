export default function markdown_message(content: string) {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: content,
      },
    },
  ];
}
