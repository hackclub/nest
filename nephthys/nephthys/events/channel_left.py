from slack_bolt.context.ack.async_ack import AsyncAck
from slack_sdk.errors import SlackApiError
from slack_sdk.web.async_client import AsyncWebClient

from nephthys.utils.env import env


async def channel_left(ack: AsyncAck, event: dict, client: AsyncWebClient):
    await ack()
    user_id = event["user"]
    channel_id = event["channel"]

    if channel_id == env.slack_help_channel:
        return

    await env.db.user.update(where={"slackId": user_id}, data={"helper": False})

    try:
        match channel_id:
            case env.slack_bts_channel:
                await client.conversations_kick(channel=channel_id, user=user_id)
            case env.slack_ticket_channel:
                await client.conversations_kick(channel=channel_id, user=user_id)
    except SlackApiError:
        pass
