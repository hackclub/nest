from slack_bolt.async_app import AsyncAck
from slack_sdk.web.async_client import AsyncWebClient

from nephthys.events.app_home_opened import open_app_home
from nephthys.utils.env import env
from nephthys.utils.logging import send_heartbeat
from nephthys.views.modals.create_tag import get_create_tag_modal


async def create_tag_view_callback(ack: AsyncAck, body: dict, client: AsyncWebClient):
    """
    Callback for the create tag view submission
    """
    await ack()
    user_id = body["user"]["id"]

    user = await env.db.user.find_unique(where={"slackId": user_id})
    if not user or not user.admin:
        await send_heartbeat(f"Attempted to create tag by non-admin user <@{user_id}>")
        return

    name = body["view"]["state"]["values"]["tag_name"]["tag_name"]["value"]
    await env.db.tag.create(data={"name": name})

    await open_app_home("tags", client, user_id)


async def create_tag_btn_callback(ack: AsyncAck, body: dict, client: AsyncWebClient):
    """
    Open modal to create a tag
    """
    await ack()
    user_id = body["user"]["id"]
    trigger_id = body["trigger_id"]

    user = await env.db.user.find_unique(where={"slackId": user_id})
    if not user or not user.admin:
        await send_heartbeat(
            f"Attempted to open create tag modal by non-admin user <@{user_id}>"
        )
        return

    view = get_create_tag_modal()
    await client.views_open(trigger_id=trigger_id, view=view, user_id=user_id)
