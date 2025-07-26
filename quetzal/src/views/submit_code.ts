import Slack from "@slack/bolt";

import { prisma } from "../util/prisma.js";
import register_form from "../blocks/register_form.js";

export function submit_code(app: Slack.App) {
  app.view("submit_code", async ({ ack, body, view, client }) => {
    console.time("submit_code");

    try {
      const codeString = view.state.values.code.code_input.value;

      if (!codeString) {
        console.timeEnd("submit_code");
        return ack();
      }
      console.timeLog("submit_code", "prisma-codes-findfirst-pre");
      const code = await prisma.codes.findFirst({
        where: {
          code: codeString,
        },
      });
      console.timeLog("submit_code", "prisma-codes-findfirst-post");

      console.timeLog("submit_code", "prisma-ack-code-invalid-pre-nopost");
      if (
        !code ||
        !code.valid ||
        (code.expiry !== null && code.expiry.valueOf() < new Date().valueOf())
      ) {
        console.timeEnd("submit_code");
        return await ack({
          response_action: "errors",
          errors: {
            code: "Invalid verification code.",
          },
        });
      }

      console.timeLog("submit_code", "slack-user-lookup-pre");
      const profileRes = await client.users.profile.get({
        user: body.user.id,
      });
      console.timeLog("submit_code", "slack-user-lookup-post");

      console.timeLog("submit_code", "slack-ack-success-pre");
      await ack({
        response_action: "update",
        view: register_form(
          profileRes.profile?.display_name ?? profileRes.profile?.real_name ?? "",
        ),
      });
      console.timeLog("submit_code", "slack-ack-success-post");
      console.timeEnd("submit_code");
      if (code.one_time) {
        await prisma.codes.update({
          where: {
            id: code.id,
          },
          data: {
            valid: false,
          },
        });
      }
    }
    catch(e: any) {
      return await ack({
        response_action: "errors",
         errors: {
           code: "An error occurred... Please report this to nest administrators, including the following text.\n" + e.stack
        }
      });
    };
  });
}
