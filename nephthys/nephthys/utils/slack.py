from typing import Any
from typing import Dict

from slack_bolt.async_app import AsyncApp
from slack_bolt.context.ack.async_ack import AsyncAck
from slack_sdk.web.async_client import AsyncWebClient

from nephthys.actions.assign_tag import assign_tag_callback
from nephthys.actions.create_tag import create_tag_btn_callback
from nephthys.actions.create_tag import create_tag_view_callback
from nephthys.actions.resolve import resolve
from nephthys.actions.tag_subscribe import tag_subscribe_callback
from nephthys.commands.dm_magic_link import dm_magic_link_cmd_callback
from nephthys.events.app_home_opened import on_app_home_opened
from nephthys.events.app_home_opened import open_app_home
from nephthys.events.channel_join import channel_join
from nephthys.events.channel_left import channel_left
from nephthys.events.message import on_message
from nephthys.options.tags import get_tags
from nephthys.utils.env import env

app = AsyncApp(token=env.slack_bot_token, signing_secret=env.slack_signing_secret)


@app.event("message")
async def handle_message(event: Dict[str, Any], client: AsyncWebClient):
    if event["channel"] == env.slack_help_channel:
        await on_message(event, client)


@app.action("mark_resolved")
async def handle_mark_resolved_button(
    ack: AsyncAck, body: Dict[str, Any], client: AsyncWebClient
):
    await ack()
    value = body["actions"][0]["value"]
    resolver = body["user"]["id"]
    await resolve(value, resolver, client)


@app.options("tag-list")
async def handle_tag_list_options(ack: AsyncAck, payload: dict):
    tags = await get_tags(payload)
    await ack(options=tags)


@app.event("app_home_opened")
async def app_home_opened_handler(event: dict[str, Any], client: AsyncWebClient):
    await on_app_home_opened(event, client)


@app.action("dashboard")
@app.action("assigned-tickets")
@app.action("tags")
@app.action("my-stats")
async def manage_home_switcher(ack: AsyncAck, body, client: AsyncWebClient):
    await ack()
    user_id = body["user"]["id"]
    action_id = body["actions"][0]["action_id"]

    await open_app_home(action_id, client, user_id)


@app.event("member_joined_channel")
async def handle_member_joined_channel(event: Dict[str, Any], client: AsyncWebClient):
    await channel_join(ack=AsyncAck(), event=event, client=client)


@app.event("member_left_channel")
async def handle_member_left_channel(event: Dict[str, Any], client: AsyncWebClient):
    await channel_left(ack=AsyncAck(), event=event, client=client)


@app.action("create-tag")
async def create_tag(ack: AsyncAck, body: Dict[str, Any], client: AsyncWebClient):
    await create_tag_btn_callback(ack, body, client)


@app.view("create_tag")
async def create_tag_view(ack: AsyncAck, body: Dict[str, Any], client: AsyncWebClient):
    await create_tag_view_callback(ack, body, client)


@app.action("tag-subscribe")
async def tag_subscribe(ack: AsyncAck, body: Dict[str, Any], client: AsyncWebClient):
    await tag_subscribe_callback(ack, body, client)


@app.action("tag-list")
async def assign_tag(ack: AsyncAck, body: Dict[str, Any], client: AsyncWebClient):
    await assign_tag_callback(ack, body, client)


@app.command("/dm-magic-link")
@app.command("/dm-magic-link-dev")
async def dm_magic_link(
    command, ack: AsyncAck, body: Dict[str, Any], client: AsyncWebClient
):
    await dm_magic_link_cmd_callback(command, ack, body, client)
