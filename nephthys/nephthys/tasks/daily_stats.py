import logging
from datetime import datetime
from datetime import timedelta
from zoneinfo import ZoneInfo

from nephthys.utils.env import env
from nephthys.utils.logging import send_heartbeat
from prisma.enums import TicketStatus


async def send_daily_stats():
    """
    Calculates and sends statistics for the previous day to a Slack channel.
    This task is intended to be run at midnight.
    """
    london_tz = ZoneInfo("Europe/London")
    now_london = datetime.now(london_tz)
    today_midnight_london = now_london.replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    # this gives us the 24-hour period of the previous day
    start_of_yesterday = today_midnight_london - timedelta(days=1)
    end_of_yesterday = today_midnight_london

    logging.info(
        f"Generating daily stats for the period: {start_of_yesterday} to {end_of_yesterday}"
    )

    try:
        tickets = await env.db.ticket.find_many() or []
        users_with_closed_tickets = await env.db.user.find_many(
            include={"closedTickets": True}, where={"helper": True}
        )

        total_open = len([t for t in tickets if t.status == TicketStatus.OPEN])
        total_in_progress = len(
            [t for t in tickets if t.status == TicketStatus.IN_PROGRESS]
        )
        total_closed = len([t for t in tickets if t.status == TicketStatus.CLOSED])
        total = len(tickets)

        sorted_users_overall = sorted(
            users_with_closed_tickets,
            key=lambda user: len(user.closedTickets or []),
            reverse=True,
        )
        overall_leaderboard_lines = [
            f"{i + 1}. <@{user.slackId}> - {len(user.closedTickets or [])} closed tickets"
            for i, user in enumerate(sorted_users_overall[:3])
        ]
        if not overall_leaderboard_lines:
            overall_leaderboard_str = "_No one's on the board yet!_"
        else:
            overall_leaderboard_str = "\n".join(overall_leaderboard_lines)

        prev_day_total = len(
            [t for t in tickets if start_of_yesterday <= t.createdAt < end_of_yesterday]
        )
        prev_day_only_closed = len(
            [
                t
                for t in tickets
                if t.status == TicketStatus.CLOSED
                and t.closedAt
                and start_of_yesterday <= t.closedAt < end_of_yesterday
                and start_of_yesterday <= t.createdAt < end_of_yesterday
            ]
        )
        prev_day_open = len(
            [
                t
                for t in tickets
                if start_of_yesterday <= t.createdAt < end_of_yesterday
                and t.status == TicketStatus.OPEN
            ]
        )
        prev_day_in_progress = len(
            [
                t
                for t in tickets
                if t.assignedAt
                and start_of_yesterday <= t.assignedAt < end_of_yesterday
                and t.status == TicketStatus.IN_PROGRESS
            ]
        )
        prev_day_closed = len(
            [
                t
                for t in tickets
                if t.status == TicketStatus.CLOSED
                and t.closedAt
                and start_of_yesterday <= t.closedAt < end_of_yesterday
            ]
        )

        daily_leaderboard_data = []
        for user in users_with_closed_tickets:
            daily_closed_count = sum(
                1
                for ticket in (user.closedTickets or [])
                if ticket.closedAt
                and start_of_yesterday <= ticket.closedAt < end_of_yesterday
            )
            if daily_closed_count > 0:
                daily_leaderboard_data.append(
                    {"user": user, "count": daily_closed_count}
                )

        sorted_daily_users = sorted(
            daily_leaderboard_data,
            key=lambda data: data["count"],
            reverse=True,
        )

        daily_leaderboard_lines = [
            f"{i + 1}. <@{data['user'].slackId}> - {data['count']} closed tickets"
            for i, data in enumerate(sorted_daily_users[:3])
        ]
        if not daily_leaderboard_lines:
            daily_leaderboard_str = "_No tickets were closed yesterday!_"
        else:
            daily_leaderboard_str = "\n".join(daily_leaderboard_lines)

        msg = f"""
um, um, hi there! hope i'm not disturbing you, but i just wanted to let you know that i've got some stats for you! :rac_cute:

well, uh, let's see here...

*:rac_graph: total stats*
tickets opened: *{total}*
tickets open: *{total_open}*
tickets in progress: *{total_in_progress}*
tickets closed: *{total_closed}*

*:rac_lfg: overall leaderboard*
{overall_leaderboard_str}

*:mc-clock: in the last 24 hours...* _(that's a day, right? right? that's a day, yeah ok)_
:rac_woah: *{prev_day_total}* total tickets were opened and you managed to close *{prev_day_only_closed}* of them! congrats!! :D
:rac_info: *{prev_day_in_progress}* tickets have been assigned to users, and *{prev_day_open}* are still open
you managed to close a whopping *{prev_day_closed}* tickets in the last 24 hours, well done!

*:rac_shy: today's leaderboard*
{daily_leaderboard_str}
"""

        await env.slack_client.chat_postMessage(
            channel=env.slack_bts_channel,
            text=msg,
        )
        logging.info("Daily stats message sent successfully.")

    except Exception as e:
        logging.error(f"Failed to send daily stats: {e}", exc_info=True)
        try:
            await send_heartbeat(
                "Failed to send daily stats",
                messages=[str(e)],
            )
        except Exception as slack_e:
            logging.error(
                f"Could not send error notification to Slack maintainer: {slack_e}"
            )
