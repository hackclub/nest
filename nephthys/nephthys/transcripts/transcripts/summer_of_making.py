from nephthys.transcripts.transcript import Transcript


class SummerOfMaking(Transcript):
    """Transcript for Summer of Making program."""

    program_name: str = "Summer of Making"
    program_owner: str = "U054VC2KM9P"

    help_channel: str = "C090JKDJYN8"
    ticket_channel: str = "C0904U79G15"
    team_channel: str = "C090EPTT84E"

    faq_link: str = "https://hackclub.slack.com/docs/T0266FRGM/F090MQF0H2Q"
    summer_help_channel: str = "C090JKDJYN8"
    identity_help_channel: str = "C092833JXKK"

    first_ticket_create: str = f"""
oh, hey (user) it looks like this is your first time here, welcome! someone should be along to help you soon but in the mean time i suggest you read the faq <{faq_link}|here>, it answers a lot of common questions. 
if your question has been answered, please hit the button below to mark it as resolved
"""
    ticket_create: str = f"someone should be along to help you soon but in the mean time i suggest you read the faq <{faq_link}|here> to make sure your question hasn't already been answered. if it has been, please hit the button below to mark it as resolved :D"
    ticket_resolve: str = f"oh, oh! it looks like this post has been marked as resolved by <@{{user_id}}>! if you have any more questions, please make a new post in <#{help_channel}> and someone'll be happy to help you out! not me though, i'm just a silly racoon ^-^"

    home_unknown_user_title: str = (
        ":upside-down_orpheus: woah, stop right there {name}!"
    )
    home_unknown_user_text: str = f"heyyyy, heidi here! it looks like i'm not allowed to show ya this. sorry! if you think this is a mistake, please reach out to <@{program_owner}> and she'll lmk what to do!"

    not_allowed_channel: str = f"heya, it looks like you're not supposed to be in that channel, pls talk to <@{program_owner}> if that's wrong"
