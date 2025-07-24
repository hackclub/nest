from nephthys.views.home.components.buttons import get_buttons
from prisma.models import User


async def get_stats_view(user: User):
    btns = get_buttons(user, "my-stats")

    return {
        "type": "home",
        "blocks": [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": ":rac_info: My Stats",
                    "emoji": True,
                },
            },
            btns,
            {"type": "divider"},
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": ":rac_cute: weh im just a silly bird, did you expect me to have stats :rac_ded: i don't even have a job >:(",
                },
            },
        ],
    }
