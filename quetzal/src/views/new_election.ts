import Slack from "@slack/bolt";

import { prisma } from "../util/prisma.js";
import approved_home from "../blocks/approved_home.js";
import get_user_shell from "../os/get_user_shell.js";

export function new_election(app: Slack.App) {
  app.view("new_election", async ({ ack, body, view, client }) => {
    const user = await prisma.users.findFirst({
      where: {
        slack_user_id: body.user.id,
      },
    });

    if (!user?.admin) {
      return;
    }

    ack();

    const start_date =
      view.state.values.start_date_input.start_date.selected_date ?? "";
    const end_date =
      view.state.values.end_date_input.end_date.selected_date ?? "";
    const count = parseInt(
      view.state.values.election_count_input.election_count.value ?? "5",
    );

    await prisma.elections.create({
      data: {
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        num_elected: count,
      },
    });

    const shell = await get_user_shell(user.tilde_username!);

    await client.views.publish({
      user_id: body.user.id,
      view: await approved_home(
        user.id,
        user.name!,
        user.tilde_username,
        user.email!,
        shell,
        user.admin,
      ),
    });
  });
}
