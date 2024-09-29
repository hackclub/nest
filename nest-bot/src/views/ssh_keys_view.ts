import Slack from "@slack/bolt";

export function ssh_keys_view(app: Slack.App) {
  app.view("ssh_keys_view", async ({ ack }) => {
    await ack();
  });
}
