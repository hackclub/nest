import asyncio

from slack_sdk.errors import SlackApiError
from slack_sdk.web.async_client import AsyncWebClient

from nephthys.utils.env import env
from nephthys.utils.logging import send_heartbeat

client = AsyncWebClient(token=env.slack_bot_token)

delete_queue = asyncio.Queue()


async def process_queue():
    """
    Continuously processes messages from the delete_queue.
    Retrieves a message (channel_id, message_ts) and attempts to delete it using Slack API.
    Handles rate limiting by retrying after the specified delay.
    Logs errors for other Slack API failures.
    """
    while True:
        channel_id, message_ts = await delete_queue.get()
        try:
            await client.chat_delete(
                channel=channel_id,
                ts=message_ts,
                as_user=True,
                token=env.slack_user_token,
            )
        except SlackApiError as e:
            if e.response and e.response["error"] == "ratelimited":
                retry_after = int(e.response.headers.get("Retry-After", 1))
                await asyncio.sleep(retry_after)
                await delete_queue.put((channel_id, message_ts))
            elif e.response and e.response["error"] == "message_not_found":
                await send_heartbeat(
                    f"Message {message_ts} in channel {channel_id} not found. It might have been already deleted."
                )
            else:
                await send_heartbeat(
                    f"Failed to delete message in channel {channel_id} with ts {message_ts}",
                    messages=[f"Error: {e.response['error']}"],
                )
        except Exception as e:
            await send_heartbeat(
                f"An unexpected error occurred while processing delete queue for message {message_ts} in channel {channel_id}",
                messages=[f"Error: {str(e)}"],
            )
            await delete_queue.put((channel_id, message_ts))
        finally:
            delete_queue.task_done()

        await asyncio.sleep(0.5)


async def add_message_to_delete_queue(channel_id: str, message_ts: str):
    """
    Adds a message identifier (channel_id, message_ts) to the asynchronous delete queue.
    """
    if not channel_id or not message_ts:
        await send_heartbeat(
            "Attempted to add invalid message to delete queue: channel_id or message_ts is missing."
        )
        return
    await delete_queue.put((channel_id, message_ts))
    await send_heartbeat(
        f"Added message {message_ts} in channel {channel_id} to delete queue."
    )


async def add_thread_to_delete_queue(channel_id: str, thread_ts: str):
    """
    Adds a thread identifier (channel_id, thread_ts) to the asynchronous delete queue.
    This is used to delete entire threads in Slack.
    """
    if not channel_id or not thread_ts:
        await send_heartbeat(
            "Attempted to add invalid thread to delete queue: channel_id or thread_ts is missing."
        )
        return
    await delete_queue.put((channel_id, thread_ts))
    messages = await client.conversations_replies(channel=channel_id, ts=thread_ts)
    msgs = messages.get("messages", [])
    if not msgs:
        return
    for message in msgs:
        if "ts" in message:
            await delete_queue.put((channel_id, message["ts"]))

    await send_heartbeat(
        f"Added thread {thread_ts} in channel {channel_id} to delete queue."
    )
