from nephthys.actions.resolve import resolve
from nephthys.macros.types import Macro
from nephthys.utils.env import env
from nephthys.utils.logging import send_heartbeat
from prisma.enums import TicketStatus
from prisma.models import Ticket
from prisma.models import User


class Resolve(Macro):
    name = "resolve"

    async def run(self, ticket: Ticket, helper: User, **kwargs) -> None:
        """
        Resolve the ticket with the given arguments.
        """
        await send_heartbeat(
            f"Resolving ticket with ts {ticket.msgTs} by <@{helper.slackId}>.",
            messages=[f"Ticket ID: {ticket.id}", f"Helper ID: {helper.id}"],
        )
        if not ticket.status == TicketStatus.CLOSED:
            await resolve(
                ts=ticket.msgTs,
                resolver=helper.slackId,
                client=env.slack_client,
            )
        else:
            await send_heartbeat(
                f"Ticket with ts {ticket.msgTs} is already closed. No action taken. (Trying to resolve for <@{helper.slackId}>).",
                messages=[f"Ticket ID: {ticket.id}", f"Helper ID: {helper.id}"],
            )
            return
