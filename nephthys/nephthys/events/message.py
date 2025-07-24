from datetime import datetime
from typing import Any
from typing import Dict

from slack_sdk.web.async_client import AsyncWebClient

from nephthys.macros import run_macro
from nephthys.utils.env import env
from nephthys.utils.logging import send_heartbeat
from prisma.enums import TicketStatus

ALLOWED_SUBTYPES = ["file_share", "me_message", "thread_broadcast"]


async def on_message(event: Dict[str, Any], client: AsyncWebClient):
    """
    Handle incoming messages in Slack.
    """
    if "subtype" in event and event["subtype"] not in ALLOWED_SUBTYPES:
        return

    user = event.get("user", "unknown")
    text = event.get("text", "")

    db_user = await env.db.user.find_first(where={"slackId": user})

    if event.get("subtype") == "thread_broadcast" and not (db_user and db_user.helper):
        await client.chat_delete(
            channel=event["channel"],
            ts=event["ts"],
            as_user=True,
            token=env.slack_user_token,
            broadcast_delete=True,
        )
        await client.chat_postEphemeral(
            channel=event["channel"],
            user=event["user"],
            text=env.transcript.thread_broadcast_delete,
            thread_ts=event["thread_ts"] if "thread_ts" in event else event["ts"],
        )

    if event.get("thread_ts"):
        if db_user and db_user.helper:
            ticket = await env.db.ticket.find_first(
                where={"msgTs": event["thread_ts"]},
                include={"openedBy": True, "tagsOnTickets": True},
            )
            if not ticket or ticket.status == TicketStatus.CLOSED:
                return
            first_word = text.split()[0].lower()

            if first_word[0] == "?" and ticket:
                await run_macro(
                    name=first_word.lstrip("?"),
                    ticket=ticket,
                    helper=db_user,
                    text=text,
                    macro_ts=event["ts"],
                )
            else:
                await env.db.ticket.update(
                    where={"msgTs": event["thread_ts"]},
                    data={
                        "assignedTo": {"connect": {"id": db_user.id}},
                        "status": TicketStatus.IN_PROGRESS,
                        "assignedAt": datetime.now()
                        if not ticket.assignedAt
                        else ticket.assignedAt,
                    },
                )
        return

    thread_url = f"https://hackclub.slack.com/archives/{env.slack_help_channel}/p{event['ts'].replace('.', '')}"

    db_user = await env.db.user.find_first(where={"slackId": user})
    if db_user:
        past_tickets = await env.db.ticket.count(where={"openedById": db_user.id})
    else:
        past_tickets = 0
        user_info = await client.users_info(user=user) or {}
        username = user_info.get("user", {})[
            "name"
        ]  # this should never actually be empty but if it is, that is a major issue

        if not username:
            await send_heartbeat(
                f"SOMETHING HAS GONE TERRIBLY WRONG <@{user}> has no username found - <@{env.slack_maintainer_id}>"
            )
        db_user = await env.db.user.upsert(
            where={
                "slackId": user,
            },
            data={
                "create": {"slackId": user, "username": username},
                "update": {"slackId": user, "username": username},
            },
        )

    user_info = await client.users_info(user=user)
    profile_pic = None
    display_name = "Explorer"
    if user_info:
        profile_pic = user_info["user"]["profile"].get("image_512", "")
        display_name = (
            user_info["user"]["profile"]["display_name"]
            or user_info["user"]["real_name"]
        )

    ticket = await client.chat_postMessage(
        channel=env.slack_ticket_channel,
        text=f"New message from <@{user}>: {text}",
        blocks=[
            {
                "type": "input",
                "label": {"type": "plain_text", "text": "Tag ticket", "emoji": True},
                "element": {
                    "action_id": "tag-list",
                    "type": "multi_external_select",
                    "placeholder": {"type": "plain_text", "text": "Select tags"},
                    "min_query_length": 0,
                },
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"Submitted by <@{user}>. They have {past_tickets} past tickets. <{thread_url}|View thread>.",
                    }
                ],
            },
        ],
        username=display_name or None,
        icon_url=profile_pic or None,
        unfurl_links=True,
        unfurl_media=True,
    )

    async with env.session.post(
        "https://ai.hackclub.com/chat/completions",
        json={
            "messages": [
                {
                    "role": "system",
                    "content": "You are a helpful assistant that helps organise tickets for Hack Club's support team. You're going to take in a message and give it a title. You will return no other content. Even if it's silly please summarise it. Use no more than 7 words, but as few as possible.",
                },
                {
                    "role": "user",
                    "content": f"Here is a message from a user: {text}\n\nPlease give this ticket a title.",
                },
            ]
        },
    ) as res:
        if res.status != 200:
            await send_heartbeat(
                f"Failed to get AI response for ticket creation: {res.status} - {await res.text()}"
            )
            title = "No title provided by AI."
        else:
            data = await res.json()
            title = data["choices"][0]["message"]["content"].strip()

    await env.db.ticket.create(
        {
            "title": title,
            "description": text,
            "msgTs": event["ts"],
            "ticketTs": ticket["ts"],
            "openedBy": {"connect": {"id": db_user.id}},
        },
    )

    text = (
        env.transcript.first_ticket_create.replace("(user)", display_name)
        if past_tickets == 0
        else env.transcript.ticket_create.replace("(user)", display_name)
    )
    ticket_url = f"https://hackclub.slack.com/archives/{env.slack_ticket_channel}/p{ticket['ts'].replace('.', '')}"

    await client.chat_postMessage(
        channel=event["channel"],
        text=text,
        blocks=[
            {"type": "section", "text": {"type": "mrkdwn", "text": text}},
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "i get it now"},
                        "style": "primary",
                        "action_id": "mark_resolved",
                        "value": f"{event['ts']}",
                    }
                ],
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"<{ticket_url}|backend> (for support team).",
                    }
                ],
            },
        ],
        thread_ts=event.get("ts"),
        unfurl_links=True,
        unfurl_media=True,
    )

    await client.reactions_add(
        channel=event["channel"], name="thinking_face", timestamp=event["ts"]
    )

    if env.uptime_url and env.environment == "production":
        async with env.session.get(env.uptime_url) as res:
            if res.status != 200:
                await send_heartbeat(
                    f"Failed to ping uptime URL: {res.status} - {await res.text()}"
                )
            else:
                await send_heartbeat(
                    f"Successfully pinged uptime URL: {res.status} - {await res.text()}"
                )
