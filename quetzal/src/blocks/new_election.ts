export default function new_election() {
  return {
    type: "modal" as const,
    callback_id: "new_election",
    title: {
      type: "plain_text" as const,
      text: "New Nest Admins Election",
      emoji: true,
    },
    submit: {
      type: "plain_text" as const,
      text: "Create",
      emoji: true,
    },
    close: {
      type: "plain_text" as const,
      text: "Cancel",
      emoji: true,
    },
    blocks: [
      {
        type: "input",
        block_id: "start_date_input",
        element: {
          type: "datepicker",
          placeholder: {
            type: "plain_text",
            text: "2025-04-1",
            emoji: true,
          },
          action_id: "start_date",
        },
        label: {
          type: "plain_text",
          text: "When should this election begin?",
          emoji: true,
        },
      },
      {
        type: "input",
        block_id: "end_date_input",
        element: {
          type: "datepicker",
          placeholder: {
            type: "plain_text",
            text: "2025-04-08",
            emoji: true,
          },
          action_id: "end_date",
        },
        label: {
          type: "plain_text",
          text: "When should this election end?",
          emoji: true,
        },
      },
      {
        type: "input",
        block_id: "election_count_input",
        element: {
          type: "number_input",
          is_decimal_allowed: false,
          action_id: "election_count",
        },
        label: {
          type: "plain_text",
          text: "How many admins should this election elect?",
          emoji: true,
        },
      },
    ],
  };
}
