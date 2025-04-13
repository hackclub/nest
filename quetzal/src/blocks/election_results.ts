export default function election_results(winners: string[]) {
  return {
    type: "modal" as const,
    title: {
      type: "plain_text" as const,
      text: "Election Results",
      emoji: true,
    },
    close: {
      type: "plain_text" as const,
      text: "Close",
      emoji: true,
    },
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Here are the winners from this election!${winners.map((w) => `\n• <@${w}>`)}`,
        },
      },
    ],
  };
}
