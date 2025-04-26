import { prisma } from "../util/prisma.js";

function shuffle(array: any[]) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {
    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
}

export default async function approved_home(
  id: number,
  name: string,
  username: string,
  email: string,
  shell: string,
  admin: boolean,
) {
  const today = new Date();

  const election = await prisma.elections.findFirst({
    where: {
      end_date: {
        gte: new Date(today.valueOf() - 7 * 24 * 60 * 60 * 1000),
      },
    },
    orderBy: {
      start_date: "desc",
    },
    include: {
      nominees: {
        include: {
          user: true,
        },
      },
    },
  });
  const electionState =
    election === null
      ? "none"
      : election.start_date < today
        ? election.end_date < today
          ? "ended"
          : "running"
        : "pending";

  const ballot = election
    ? await prisma.ballots.findFirst({
        where: {
          electionsId: election.id,
          usersId: id,
        },
      })
    : null;
  const nomination = election
    ? await prisma.nominees.findFirst({
        where: {
          electionsId: election.id,
          usersId: id,
        },
      })
    : null;

  const nominees = election?.nominees;
  if (nominees) {
    shuffle(nominees);
  }

  return {
    type: "home" as const,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "Quetzal",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Welcome to Nest! Here's your profile - if you have any questions, ask in the #nest channel!",
        },
      },
      {
        type: "divider",
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Nest Username:* ${username}`,
        },
      },
      {
        type: "divider",
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Full Name:* ${name}`,
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "Edit",
            emoji: true,
          },
          value: "edit_full_name",
          action_id: "edit_full_name",
        },
      },
      {
        type: "divider",
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Email:* ${email}`,
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "Edit",
            emoji: true,
          },
          value: "edit_email",
          action_id: "edit_email",
        },
      },
      {
        type: "divider",
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Your SSH public keys*",
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "Edit",
            emoji: true,
          },
          value: username,
          action_id: "edit_ssh_keys",
        },
      },
      {
        type: "divider",
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Current Shell:* \`${shell}\``,
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "Edit",
            emoji: true,
          },
          value: shell,
          action_id: "edit_shell",
        },
      },
      {
        type: "divider",
      },
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "Admins",
        },
      },
      ...(election === null
        ? [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "There is no election currently running. The current Nest admins are <!subteam^S06QGQG6FG8>.",
              },
            },
            admin
              ? {
                  type: "actions",
                  elements: [
                    {
                      type: "button",
                      text: {
                        type: "plain_text",
                        text: "Start a new election",
                      },
                      action_id: "new_election",
                    },
                  ],
                }
              : null,
          ].filter((t) => t !== null)
        : [
            {
              type: "section",
              text: {
                type: "plain_text",
                text: `The election ${electionState === "pending" ? `will start` : "started"} on ${election.start_date.toLocaleDateString()} and ${electionState === "ended" ? "ended" : "will end"} on ${election.end_date.toLocaleDateString()}.`,
                emoji: true,
              },
            },
            {
              type: "section",
              text: {
                type: "plain_text",
                text: "The nominees for this election are:",
                emoji: true,
              },
            },
            ...nominees!.map((n) => ({
              type: "section",
              text: {
                type: "mrkdwn",
                text: `- *<@${n.user.slack_user_id}>* - ${n.message}`,
              },
            })),
            electionState === "pending" && nomination == null
              ? {
                  type: "actions",
                  elements: [
                    {
                      type: "button",
                      text: {
                        type: "plain_text",
                        text: "Nominate myself",
                      },
                      value: election.id.toString(),
                      action_id: "nominate",
                    },
                  ],
                }
              : null,
            admin && electionState === "ended"
              ? {
                  type: "actions",
                  elements: [
                    {
                      type: "button",
                      text: {
                        type: "plain_text",
                        text: "View results",
                      },
                      style: "primary",
                      value: election.id.toString(),
                      action_id: "election_results",
                    },
                  ],
                }
              : electionState === "running"
                ? {
                    type: "section",
                    text: {
                      type: "mrkdwn",
                      text:
                        ballot === null
                          ? "You have not yet voted in this election."
                          : "You have already voted in this election",
                    },
                    accessory: {
                      type: "button",
                      text: {
                        type: "plain_text",
                        text: ballot === null ? "Vote" : "Edit votes",
                      },
                      value: election.id.toString(),
                      action_id: "vote",
                    },
                  }
                : null,
          ].filter((t) => t !== null)),
    ],
  };
}
