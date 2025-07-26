import Slack from "@slack/bolt";

import { prisma } from "../util/prisma.js";
import register_form from "../blocks/register_form.js";

export function submit_code(app: Slack.App) {
  app.view("submit_code", async ({ ack, body, view, client }) => {
    try {
      const codeString = view.state.values.code.code_input.value;

      if (!codeString) {
        return ack();
      }

      const code = await prisma.codes.findFirst({
        where: {
          code: codeString,
        },
      });

      if (
        !code ||
        !code.valid ||
        (code.expiry !== null && code.expiry.valueOf() < new Date().valueOf())
      ) {
        return await ack({
          response_action: "errors",
          errors: {
            code: "Invalid verification code.",
          },
        });
      }

      const profileRes = await client.users.profile.get({
        user: body.user.id,
      });

      await ack({
        response_action: "update",
        view: register_form(
          profileRes.profile?.display_name ?? profileRes.profile?.real_name ?? "",
        ),
      });

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
