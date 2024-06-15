export default function approval_message(
  slack_user: string,
  name: string,
  username: string,
  email: string,
  ssh_key: string,
  description: string
) {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `You have a new request from <@${slack_user}>`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Full Name:*\n${name}\n*Username:*\n${username}\n*Email:* ${email}\n*SSH Public Key:* \`${ssh_key}\`\n*Description:* ${description}`,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            emoji: true,
            text: "Approve",
          },
          style: "primary",
          value: "approve",
          action_id: "approve_action",
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            emoji: true,
            text: "Deny",
          },
          style: "danger",
          value: "deny",
          action_id: "deny_action",
        },
      ],
    },
  ];
}
