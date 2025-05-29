export default function register_form(profile_name: string) {
  return {
    callback_id: "register_user",
    type: "modal" as const,
    submit: {
      type: "plain_text" as const,
      text: "Submit",
      emoji: true,
    },
    close: {
      type: "plain_text" as const,
      text: "Cancel",
      emoji: true,
    },
    title: {
      type: "plain_text" as const,
      text: "Register for Nest",
      emoji: true,
    },
    blocks: [
      {
        type: "section",
        text: {
          type: "plain_text",
          text: `:wave: Hey ${profile_name}!\n\nPlease enter the required details to register for Nest!`,
          emoji: true,
        },
      },
      {
        type: "divider",
      },
      {
        type: "input",
        block_id: "username",
        label: {
          type: "plain_text",
          text: "Nest username? (This will be your Linux username as well as your subdomain on hackclub.app)",
          emoji: true,
        },
        element: {
          type: "plain_text_input",
          action_id: "username_input",
        },
      },
      {
        type: "input",
        block_id: "name",
        label: {
          type: "plain_text",
          text: "Full name? (May be displayed publicly through OAuth2 apps)",
          emoji: true,
        },
        element: {
          type: "plain_text_input",
          action_id: "name_input",
        },
      },
      {
        type: "input",
        block_id: "email",
        label: {
          type: "plain_text",
          text: "Email?",
          emoji: true,
        },
        element: {
          type: "plain_text_input",
          action_id: "email_input",
        },
      },
      {
        type: "input",
        block_id: "ssh_key",
        label: {
          type: "plain_text",
          text: "Public SSH key? (add one for now, you can add more once you've been approved)",
          emoji: true,
        },
        element: {
          type: "plain_text_input",
          action_id: "ssh_key_input",
          multiline: true,
        },
      },
      {
        type: "input",
        block_id: "description",
        label: {
          type: "plain_text",
          text: "What do you plan to use Nest for?",
          emoji: true,
        },
        element: {
          type: "plain_text_input",
          action_id: "description_input",
          multiline: true,
        },
      },
    ],
  };
}
