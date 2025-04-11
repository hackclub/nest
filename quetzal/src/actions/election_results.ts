import Slack from "@slack/bolt";
import { stv } from "stv";

import { prisma } from "../util/prisma.js";
import election_results_view from "../blocks/election_results.js";

export function election_results(app: Slack.App) {
  app.action("election_results", async ({ ack, body, client }) => {
    ack();

    if (body.type !== "block_actions" || body.actions[0].type !== "button") {
      return;
    }

    const user = await prisma.users.findUnique({
      where: {
        slack_user_id: body.user.id,
      },
    });

    if (!user?.admin) {
      return;
    }

    const election = await prisma.elections.findUnique({
      where: {
        id: parseInt(body.actions[0].value!),
      },
      include: {
        nominees: true,
        ballots: {
          include: {
            votes: true,
          },
        },
      },
    });

    if (!election) {
      return;
    }

    const results = stv({
      seatsToFill: election?.num_elected,
      candidates: election.nominees.map((n) => n.id.toString()),
      votes: election.ballots.map((b) => ({
        weight: 1,
        preferences: b.votes.map((v) => v.nomineesId.toString()),
      })),
    });

    const winners = (
      await Promise.all(
        results.winners.map((w) =>
          prisma.nominees.findUnique({
            where: { id: parseInt(w) },
            select: {
              user: {
                select: {
                  slack_user_id: true,
                },
              },
            },
          }),
        ),
      )
    ).map((w) => w!.user.slack_user_id);

    await client.views.open({
      trigger_id: body.trigger_id,
      view: election_results_view(winners),
    });
  });
}
