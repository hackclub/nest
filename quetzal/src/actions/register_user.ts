import Slack from "@slack/bolt";

import register_form from "../blocks/register_form.js";
import verification_required from "../blocks/verification_required.js";

export function register_user(app: Slack.App) {
  app.action("register_user", async ({ ack, body, client }) => {
    ack();

    if (body.type !== "block_actions") {
      return;
    }

    const profileRes = await client.users.profile.get({
      user: body.user.id,
    });

    if (!profileRes.ok) {
      return;
    }
    const headers = new Headers();
    headers.append("Content-Type", "application/json");

    const verificationResponse1 = (await (
      await fetch("https://identity.hackclub.com/api/external/check?slack_id="+ body?.user?.id, {
        method: "GET",
        headers: headers,
        redirect: "follow",
      })
    ).json()).result;

    const acceptableResponses = ["verified_eligible"]
    if (
         !acceptableResponses.includes(verificationResponse1)
    ) {
      await client.views.open({
        trigger_id: body.trigger_id,
        view: verification_required(),
      });
    } else
      await client.views.open({
        trigger_id: body.trigger_id,
        view: register_form(
          profileRes.profile?.display_name ??
            profileRes.profile?.real_name ??
            "",
        ),
      });
  });
}
