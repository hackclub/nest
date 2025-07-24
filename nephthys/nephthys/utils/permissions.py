from nephthys.utils.env import env


async def can_resolve(slack_id: str, user_id: int, ts: str) -> bool:
    """
    Check if the user has permission to resolve tickets.

    Args:
        user_id (str): The Slack ID of the user to check permissions for.
        ts (str): The timestamp of the ticket message to check.

    Returns:
        bool: True if the user can resolve tickets, False otherwise.
    """
    res = await env.slack_client.conversations_members(channel=env.slack_ticket_channel)
    team = res.get("members", [])

    if slack_id in team:
        return True

    tkt = await env.db.ticket.find_unique(where={"msgTs": ts})

    if not tkt or tkt.openedById != user_id:
        return False

    return True
