import asyncio
import logging
from datetime import datetime
from datetime import timedelta
from datetime import timezone

from slack_sdk.errors import SlackApiError

from nephthys.actions.resolve import resolve
from nephthys.utils.env import env
from nephthys.utils.logging import send_heartbeat
from prisma.enums import TicketStatus


async def get_is_stale(ts: str, max_retries: int = 3) -> bool:
    for attempt in range(max_retries):
        try:
            replies = await env.slack_client.conversations_replies(
                channel=env.slack_help_channel, ts=ts, limit=1000
            )
            last_reply = (
                replies.get("messages", [])[-1] if replies.get("messages") else None
            )
            if not last_reply:
                logging.error("No replies found - this should never happen")
                await send_heartbeat(f"No replies found for ticket {ts}")
                return False
            return (
                datetime.now(tz=timezone.utc)
                - datetime.fromtimestamp(float(last_reply["ts"]), tz=timezone.utc)
            ) > timedelta(days=3)
        except SlackApiError as e:
            if e.response["error"] == "ratelimited":
                retry_after = int(e.response.headers.get("Retry-After", 1))
                # Exponential backoff: wait longer on each retry
                wait_time = retry_after * (2**attempt)
                logging.warning(
                    f"Rate limited while fetching replies for ticket {ts}. "
                    f"Attempt {attempt + 1}/{max_retries}. Retrying after {wait_time} seconds."
                )
                await asyncio.sleep(wait_time)
                if attempt == max_retries - 1:
                    logging.error(f"Max retries exceeded for ticket {ts}")
                    return False
            if e.response["error"] == "thread_not_found":
                logging.warning(
                    f"Thread not found for ticket {ts}. This might be a deleted thread."
                )
                await send_heartbeat(f"Thread not found for ticket {ts}.")
                maintainer_user = await env.db.user.find_unique(
                    # where={"slackId": env.slack_maintainer_id}
                    where={"slackId": "U054VC2KM9P"}
                )
                if maintainer_user:
                    await env.db.ticket.update(
                        where={"msgTs": ts},
                        data={
                            "status": TicketStatus.CLOSED,
                            "closedAt": datetime.now(),
                            "closedBy": {"connect": {"id": maintainer_user.id}},
                        },
                    )
                else:
                    await env.db.ticket.update(
                        where={"msgTs": ts},
                        data={
                            "status": TicketStatus.CLOSED,
                            "closedAt": datetime.now(),
                        },
                    )
                return False
            else:
                logging.error(
                    f"Error fetching replies for ticket {ts}: {e.response['error']}"
                )
                await send_heartbeat(
                    f"Error fetching replies for ticket {ts}: {e.response['error']}"
                )
                return False
    return False


async def close_stale_tickets():
    """
    Closes tickets that have been open for more than 3 days.
    This task is intended to be run periodically.
    """

    logging.info("Closing stale tickets...")
    await send_heartbeat("Closing stale tickets...")

    try:
        tickets = await env.db.ticket.find_many(
            where={"NOT": [{"status": TicketStatus.CLOSED}]},
            include={"openedBy": True, "assignedTo": True},
        )
        stale = 0

        # Process tickets in batches to avoid overwhelming the API
        batch_size = 10
        for i in range(0, len(tickets), batch_size):
            batch = tickets[i : i + batch_size]
            logging.info(
                f"Processing batch {i // batch_size + 1}/{(len(tickets) + batch_size - 1) // batch_size}"
            )

            for ticket in batch:
                await asyncio.sleep(1.2)  # Rate limiting delay

                if await get_is_stale(ticket.msgTs):
                    stale += 1
                    resolver = (
                        ticket.assignedToId
                        if ticket.assignedToId
                        else ticket.openedById
                    )
                    await resolve(
                        ticket.msgTs,
                        resolver,  # type: ignore (this is explicitly fetched in the db call)
                        env.slack_client,
                        stale=True,
                    )

            # Longer delay between batches
            if i + batch_size < len(tickets):
                await asyncio.sleep(5)

        await send_heartbeat(f"Closed {stale} stale tickets.")

        logging.info(f"Closed {stale} stale tickets.")
    except Exception as e:
        logging.error(f"Error closing stale tickets: {e}")
        await send_heartbeat(f"Error closing stale tickets: {e}")
