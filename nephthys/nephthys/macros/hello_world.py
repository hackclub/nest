from nephthys.macros.types import Macro
from nephthys.utils.env import env


class HelloWorld(Macro):
    name = "hii"

    async def run(self, ticket, helper, **kwargs):
        """
        A simple hello world macro that does nothing.
        """
        user_info = await env.slack_client.users_info(user=helper.slackId)
        name = (
            user_info["user"]["profile"].get("display_name")
            or user_info["user"]["profile"].get("real_name")
            or user_info["user"]["name"]
        )
        await env.slack_client.chat_postMessage(
            text=f"hey, {name}! i'm heidi :rac_shy: say hi to orpheus for me would you? :rac_cute:",
            channel=env.slack_help_channel,
            thread_ts=ticket.msgTs,
        )
