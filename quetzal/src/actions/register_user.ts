import Slack from "@slack/bolt";

import register_form from "../blocks/register_form.js";

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

    const verificationResponse = await (
      await fetch("https://verify.hackclub.dev/api/status", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          slack_id: body.user.id,
          email: profileRes.profile?.email,
        }),
        redirect: "follow",
      })
    ).text();

    if (
      !verificationResponse.includes("Eligible L1") &&
      !verificationResponse.includes("Eligible L2")
    ) {
      await app.client.chat.postMessage({
        channel: body.user.id,
        text: "Before you can sign up for nest, you'll need to verify that you are a student with Hack Club. Please see https://forms.hackclub.com/eligibility for more details. Note that this form is processed by Hack Club HQ (not Nest), so if you have any questions about how to complete it, please email verifications@hackclub.com. It may take a while for the team to process your submission.",
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
