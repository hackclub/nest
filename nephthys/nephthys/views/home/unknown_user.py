from nephthys.utils.env import env


def get_unknown_user_view(name: str):
    return {
        "type": "home",
        "blocks": [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": env.transcript.home_unknown_user_title.format(name=name),
                    "emoji": True,
                },
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": env.transcript.home_unknown_user_text,
                },
            },
        ],
    }
