import Slack from "@slack/bolt";
import * as crypto from "node:crypto";

import { prisma } from "../util/prisma.js";
import get_user_shell from "../os/get_user_shell.js";
import verification_code from "../blocks/verification_code.js";
import approved_home from "../blocks/approved_home.js";

export function new_verification_code(app: Slack.App) {
  app.view("new_verification_code", async ({ ack, body, view, client }) => {
    const one_time =
      (view.state.values.one_time.one_time_input.value ?? "no") == "yes";
    const expiry = view.state.values.expiry.expiry_input.selected_date_time
      ? new Date(view.state.values.expiry.expiry_input.selected_date_time)
      : null;

    const user = await prisma.users.findFirst({
      where: {
        slack_user_id: body.user.id,
      },
    });

    if (!user?.admin) return;

    const code = await prisma.codes.create({
      data: {
        code: crypto.randomBytes(10).toString("hex"),
        generated_on: new Date(),
        generated_by_id: user.id,
        one_time: one_time,
        expiry,
      },
    });

    await ack({
      response_action: "update",
      view: verification_code(code.code),
    });

    const shell = await get_user_shell(user.tilde_username!);

    await client.views.publish({
      user_id: body.user.id,
      view: await approved_home(
        user.id,
        user.name!,
        user.tilde_username,
        user.email!,
        shell!,
        user.admin,
      ),
    });
  });
}
