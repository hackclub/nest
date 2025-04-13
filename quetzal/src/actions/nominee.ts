import Slack from "@slack/bolt";

export function nominee(app: Slack.App) {
  app.action(/nominee_\d+_select/, async ({ ack, body, client }) => {
    ack();
  });
}
