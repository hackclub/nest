import { prisma } from "../util/prisma.js";

export default async function vote(electionId: string, userId: string) {
  const user = await prisma.users.findFirst({
    where: {
      slack_user_id: userId,
    },
  });

  const election = await prisma.elections.findUnique({
    where: {
      id: parseInt(electionId),
    },
    include: {
      nominees: {
        include: {
          user: true,
        },
      },
    },
  });

  if (
    (election?.start_date ?? new Date()).valueOf() <
    (user?.created_at?.valueOf() ?? 0)
  ) {
    return {
      type: "modal" as const,
      title: {
        type: "plain_text" as const,
        text: "Vote",
        emoji: true,
      },
      close: {
        type: "plain_text" as const,
        text: "Exit",
        emoji: true,
      },
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `As your Nest account was created after this election started, you cannot vote.`,
          },
        },
      ],
    };
  }

  const ballot = await prisma.ballots.findFirst({
    where: {
      electionsId: parseInt(electionId),
      caster: {
        slack_user_id: userId,
      },
    },
    include: {
      votes: true,
    },
  });

  return {
    type: "modal" as const,
    callback_id: "vote",
    private_metadata: electionId,
    title: {
      type: "plain_text" as const,
      text: "Vote",
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
          text: `Welcome to the polls! Here, you can vote for the next Nest admins.\n• Admin terms last for 1 year\n• There is no term limit\n• ${election?.num_elected} admins will be elected in this election`,
        },
      },
      {
        type: "divider",
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Rank each nominee from best to worst (so that the person you would like to be an admin the most is #1):",
        },
      },
      ...election!.nominees.map((n, i) => {
        const initial = ballot?.votes.find((v) => v.nomineesId === n.id);
        return {
          type: "section",
          block_id: `nominee_${i + 1}`,
          text: {
            type: "mrkdwn",
            text: `*<@${n.user.slack_user_id}>*`,
          },
          accessory: {
            type: "static_select",
            placeholder: {
              type: "plain_text",
              text: "Rank",
              emoji: true,
            },
            options: election?.nominees.map((e, i) => ({
              text: {
                type: "plain_text",
                text: `${i + 1}`,
                emoji: true,
              },
              value: `${i + 1}`,
            })),
            initial_option: initial
              ? {
                  text: {
                    type: "plain_text",
                    text: `${initial.rank}`,
                    emoji: true,
                  },
                  value: `${initial.rank}`,
                }
              : undefined,
            action_id: `nominee_${i + 1}_select`,
          },
        };
      }),
    ],
  };
}
