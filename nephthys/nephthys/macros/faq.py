from nephthys.actions.resolve import resolve
from nephthys.macros.types import Macro
from nephthys.utils.env import env


class FAQ(Macro):
    name = "faq"

    async def run(self, ticket, helper, **kwargs):
        """
        A simple macro reminding people to check the FAQ.
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
            text=f"hey, {name}! this question is answered in the faq i sent earlier, please make sure to check it out! :rac_cute:\n\n<{env.transcript.faq_link}|here it is again>",
            channel=env.slack_help_channel,
            thread_ts=ticket.msgTs,
        )
        await resolve(
            ts=ticket.msgTs,
            resolver=helper.slackId,
            client=env.slack_client,
        )
