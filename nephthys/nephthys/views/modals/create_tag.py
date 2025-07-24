def get_create_tag_modal():
    return {
        "type": "modal",
        "callback_id": "create_tag",
        "title": {
            "type": "plain_text",
            "text": ":rac_info: create a tag!",
            "emoji": True,
        },
        "blocks": [
            {
                "type": "input",
                "block_id": "tag_name",
                "label": {
                    "type": "plain_text",
                    "text": "giv name?",
                    "emoji": True,
                },
                "element": {
                    "type": "plain_text_input",
                    "action_id": "tag_name",
                },
            },
        ],
        "submit": {
            "type": "plain_text",
            "text": ":rac_question: add tag?",
            "emoji": True,
        },
    }
