import logging

from nephthys.utils.env import env


async def update_helpers():
    res = await env.slack_client.conversations_members(channel=env.slack_bts_channel)
    team_ids = res.get("members", [])

    # Get bot user ID to exclude from helpers
    bot_info = await env.slack_client.auth_test()
    bot_user_id = bot_info.get("user_id")

    # Filter out bot user from team_ids
    if bot_user_id and bot_user_id in team_ids:
        team_ids = [user_id for user_id in team_ids if user_id != bot_user_id]

    if not team_ids:
        # if this happens then something concerning has happened :p
        await env.slack_client.chat_postMessage(
            channel=env.slack_bts_channel,
            text=f"No members found in the bts channel. <@{env.slack_maintainer_id}>",
        )
        return

    # unset helpers not in the team
    await env.db.user.update_many(
        where={"helper": True, "slackId": {"not_in": team_ids}},
        data={"helper": False},
    )

    # update existing users in the db
    await env.db.user.update_many(
        where={"slackId": {"in": team_ids}},
        data={"helper": True},
    )

    # create new users not in the db
    existing_users_in_db = await env.db.user.find_many(
        where={"slackId": {"in": team_ids}}
    )
    existing_user_ids_in_db = {user.slackId for user in existing_users_in_db}

    new_member_data_to_create = []
    for member_id in team_ids:
        if member_id not in existing_user_ids_in_db:
            user_info = await env.slack_client.users_info(user=member_id)
            logging.info(
                f"Creating new helper user {member_id} with info {user_info.get('name')}"
            )
            logging.info(f"User info for {member_id}: {user_info}")
            new_member_data_to_create.append(
                {
                    "slackId": member_id,
                    "helper": True,
                    "username": user_info.get("user", {}).get("name"),
                }
            )

    if new_member_data_to_create:
        await env.db.user.create_many(data=new_member_data_to_create)
