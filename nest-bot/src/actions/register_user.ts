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

    await client.views.open({
      trigger_id: body.trigger_id,
      view: register_form(
        profileRes.profile?.display_name ?? profileRes.profile?.real_name ?? ""
      ),
    });
  });
}
