from nephthys.actions.resolve import resolve
from nephthys.macros.types import Macro
from nephthys.utils.env import env


class Identity(Macro):
    name = "identity"

    async def run(self, ticket, helper, **kwargs):
        """
        A simple macro telling people to use the identity help channel
        """
        sender = await env.db.user.find_first(where={"id": ticket.openedById})
        if not sender:
            return
        user_info = await env.slack_client.users_info(user=sender.slackId)
        name = (
            user_info["user"]["profile"].get("display_name")
            or user_info["user"]["profile"].get("real_name")
            or user_info["user"]["name"]
        )
        await env.slack_client.chat_postMessage(
            text=f"hey, {name}! please could you ask questions about identity verification in <#{env.transcript.identity_help_channel}>? :rac_cute:\n\nit helps the verification team keep track of questions easier!",
            channel=env.slack_help_channel,
            thread_ts=ticket.msgTs,
        )
        await resolve(
            ts=ticket.msgTs,
            resolver=helper.slackId,
            client=env.slack_client,
        )
