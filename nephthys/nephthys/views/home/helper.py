import pytz

from nephthys.utils.env import env
from nephthys.views.home.components.buttons import get_buttons
from nephthys.views.home.components.leaderboards import get_leaderboard_view
from nephthys.views.home.components.ticket_status_pie import get_ticket_status_pie_chart
from nephthys.views.home.error import get_error_view
from prisma.models import User


async def get_helper_view(user: User):
    user_info = await env.slack_client.users_info(user=user.slackId)
    if not user_info or not (slack_user := user_info.get("user")):
        return get_error_view(
            ":rac_freaking: oops, i couldn't find your info! try again in a bit?"
        )
    tz_string = slack_user.get("tz", "Europe/London")
    tz = pytz.timezone(tz_string)

    pie_chart = await get_ticket_status_pie_chart(user, tz)
    leaderboard = await get_leaderboard_view()

    btns = get_buttons(user, "dashboard")

    return {
        "type": "home",
        "blocks": [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": ":rac_cute: helper heidi",
                    "emoji": True,
                },
            },
            btns,
            {"type": "divider"},
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": ":rac_graph: funny circle and line things",
                    "emoji": True,
                },
            },
            pie_chart,
            *leaderboard,
        ],
    }
