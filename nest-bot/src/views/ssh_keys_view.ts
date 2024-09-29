import Slack from "@slack/bolt";

export function ssh_keys_view(app: Slack.App) {
  app.view("edit_shell", async ({ ack }) => {
    await ack();
  });
}
