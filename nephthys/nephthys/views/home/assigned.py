import pytz

from nephthys.utils.env import env
from nephthys.views.home.components.buttons import get_buttons
from prisma.enums import TicketStatus
from prisma.models import User


async def get_assigned_tickets_view(user: User):
    btns = get_buttons(user, "assigned-tickets")

    tickets = (
        await env.db.ticket.find_many(
            where={"assignedToId": user.id, "NOT": [{"status": TicketStatus.CLOSED}]},
            include={"openedBy": True},
        )
        or []
    )

    if not tickets:
        return {
            "type": "home",
            "blocks": [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": ":rac_cute: no assigned tickets",
                        "emoji": True,
                    },
                },
                btns,
                {"type": "divider"},
                {
                    "type": "section",
                    "text": {
                        "type": "plain_text",
                        "text": ":rac_believes_in_theory_about_green_lizards_and_space_lasers: you don't have any assigned tickets right now!",
                        "emoji": True,
                    },
                },
            ],
        }

    ticket_blocks = []
    for ticket in tickets:
        unix_ts = int(ticket.createdAt.timestamp())
        time_ago_str = f"<!date^{unix_ts}^opened {{ago}}|at {ticket.createdAt.astimezone(pytz.timezone('Europe/London')).strftime('%H:%M %Z')}>"
        ticket_blocks.append(
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*{ticket.title}*\n _from <@{ticket.openedBy.slackId}>. {time_ago_str}_",
                },
                "accessory": {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": ":rac_info: view ticket",
                        "emoji": True,
                    },
                    "action_id": f"view-ticket-{ticket.msgTs}",
                    "url": f"https://hackclub.slack.com/archives/{env.slack_help_channel}/p{ticket.msgTs.replace('.', '')}",
                    "value": ticket.msgTs,
                },
            }
        )
        ticket_blocks.append({"type": "divider"})

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
                    "text": ":rac_cute: here are your assigned tickets <3",
                    "emoji": True,
                },
            },
            *ticket_blocks,
        ],
    }
