import logging
import re
from urllib.parse import quote

from slack_bolt.async_app import AsyncAck
from slack_sdk.web.async_client import AsyncWebClient

from nephthys.utils.env import env
from nephthys.utils.logging import send_heartbeat


async def dm_magic_link_cmd_callback(
    command, ack: AsyncAck, body: dict, client: AsyncWebClient
):
    await ack()
    logging.info(f"Received command: {command}")
    user_id = body["user_id"]
    user = await env.db.user.find_unique(where={"slackId": user_id})
    if not user or not user.helper:
        await client.chat_postEphemeral(
            channel=body["channel_id"],
            user=user_id,
            text=env.transcript.dm_magic_link_no_permission,
        )
        return

    cmd_text = command.get("text", "").strip()
    if not cmd_text:
        await client.chat_postEphemeral(
            channel=body["channel_id"],
            user=body["user_id"],
            text=env.transcript.dm_magic_link_no_user,
        )
    parsed = re.search(r"<@([UW][A-Z0-9]+)(?:\|[^>]+)?>", cmd_text)
    slack_id = parsed.group(1) if parsed else None
    if not slack_id:
        await client.chat_postEphemeral(
            channel=body["channel_id"],
            user=body["user_id"],
            text=env.transcript.dm_magic_link_no_user,
        )
        return

    user_info = await client.users_info(user=slack_id)
    if not user_info or not user_info.get("user"):
        await client.chat_postEphemeral(
            channel=body["channel_id"],
            user=body["user_id"],
            text=env.transcript.dm_magic_link_no_user,
        )
        return

    email = user_info["user"]["profile"].get("email")

    # # Generate a magic link for the user
    async with env.session.post(
        f"{env.site_url}/explorpheus/magic-link?token={env.site_api_key}&email={quote(email)}&slack_id={slack_id}"
    ) as res:
        if res.status != 200:
            await send_heartbeat(
                f"Failed to generate magic link for <@{slack_id}>: {res.status} - {await res.text()}"
            )
            await client.chat_postEphemeral(
                channel=body["channel_id"],
                user=body["user_id"],
                text=env.transcript.dm_magic_link_error.format(status=res.status),
            )
            return

        data = await res.json()
        magic_link = data.get("link")
        logging.info(f"Generated magic link for <@{slack_id}>: {magic_link}")
    if not magic_link:
        await send_heartbeat(
            f"Failed to generate magic link for <@{slack_id}>: No link returned"
        )
        await client.chat_postEphemeral(
            channel=body["channel_id"],
            user=body["user_id"],
            text=env.transcript.dm_magic_link_error.format(status="No link returned"),
        )
        return

    await client.chat_postEphemeral(
        channel=body["channel_id"],
        user=body["user_id"],
        text=env.transcript.dm_magic_link_success,
    )

    await client.chat_postMessage(
        channel=slack_id,
        text=env.transcript.dm_magic_link_message.format(magic_link=magic_link),
    )
    logging.info(f"Sent magic link to {slack_id}")
