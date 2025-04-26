import Slack from "@slack/bolt";

import { prisma } from "../util/prisma.js";
import approved_home from "../blocks/approved_home.js";
import get_user_shell from "../os/get_user_shell.js";

export function vote(app: Slack.App) {
  app.view("vote", async ({ ack, body, view, client }) => {
    const user = await prisma.users.findFirst({
      where: {
        slack_user_id: body.user.id,
      },
    });

    if (!user) return;

    const electionId = parseInt(view.private_metadata);
    const election = await prisma.elections.findUnique({
      where: {
        id: electionId,
      },
      include: {
        nominees: true,
      },
    });

    let votes: { nominee: number; rank: number }[] = [];
    for (let i = 0; i < election!.nominees.length; i++) {
      votes.push({
        nominee: election!.nominees[i].id,
        rank: parseInt(
          view.state.values[`nominee_${i + 1}`][`nominee_${i + 1}_select`]
            .selected_option?.value ?? "1",
        ),
      });
    }

    let counted: number[] = [];
    for (let i = 0; i < votes.length; i++) {
      const vote = votes[i];

      if (counted.includes(vote.rank)) {
        return ack({
          response_action: "errors",
          errors: {
            [`nominee_${i + 1}`]: "Duplicate rank",
          },
        });
      } else {
        counted.push(vote.rank);
      }
    }

    ack();

    let ballot = await prisma.ballots.findFirst({
      where: {
        usersId: user.id,
        electionsId: electionId,
      },
      include: {
        votes: true,
      },
    });

    if (ballot === null) {
      ballot = await prisma.ballots.create({
        data: {
          usersId: user.id,
          electionsId: electionId,
        },
        include: {
          votes: true,
        },
      });

      await prisma.ballots.update({
        where: {
          id: ballot.id,
        },
        data: {
          votes: {
            createMany: {
              data: votes.map((v) => ({
                nomineesId: v.nominee,
                rank: v.rank,
                ballotId: ballot!.id,
              })),
            },
          },
        },
      });
    } else {
      for (const vote of ballot.votes) {
        await prisma.votes.update({
          where: {
            id: vote.id,
          },
          data: {
            rank: votes.find((v) => v.nominee === vote.nomineesId)?.rank,
          },
        });
      }
    }

    const shell = await get_user_shell(user.tilde_username!);

    const userInfo = await client.users.info({
      user: body.user.id,
    });

    await client.views.publish({
      user_id: body.user.id,
      view: await approved_home(
        user.id,
        user.name!,
        user.tilde_username,
        user.email!,
        shell,
        user.admin,
        userInfo.user?.tz!,
      ),
    });
  });
}
