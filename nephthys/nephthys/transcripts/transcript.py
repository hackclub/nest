from pydantic import BaseModel
from pydantic import Field
from pydantic import model_validator


class Transcript(BaseModel):
    """Class to hold all the transcript messages and links used in the bot."""

    class Config:
        """Configuration for the Pydantic model."""

        extra = "forbid"

    program_name: str = Field(
        default="Summer of Making", description="Name of the program"
    )
    program_owner: str = Field(
        default="U054VC2KM9P",
        description="Slack ID of the support manager",
    )
    help_channel: str = Field(
        default="",
        description="Slack channel ID for help requests",
    )
    ticket_channel: str = Field(
        default="",
        description="Slack channel ID for ticket creation",
    )
    team_channel: str = Field(
        default="",
        description="Slack channel ID for team discussions and stats",
    )

    @property
    def program_snake_case(self) -> str:
        """Snake case version of the program name."""
        return self.program_name.lower().replace(" ", "_")

    faq_link: str = Field(
        default="https://hackclub.slack.com/docs/T0266FRGM/F093F8D7EE9",
        description="FAQ link URL",
    )

    summer_help_channel: str = Field(
        default="C091D312J85", description="Summer help channel ID"
    )

    identity_help_channel: str = Field(
        default="C092833JXKK", description="Identity help channel ID"
    )

    first_ticket_create: str = Field(
        default="", description="Message for first-time ticket creators"
    )

    ticket_create: str = Field(default="", description="Message for ticket creation")

    ticket_resolve: str = Field(
        default="", description="Message when ticket is resolved"
    )

    ticket_resolve_stale: str = Field(
        default="",
        description="Message when ticket is resolved due to being stale",
    )

    thread_broadcast_delete: str = Field(
        default="hey! please keep your messages *all in one thread* to make it easier to read! i've gone ahead and removed that message from the channel for ya :D",
    )

    home_unknown_user_title: str = Field(
        default=":upside-down_orpheus: woah, stop right there {name}!",
        description="Title for unknown user on home page",
    )

    home_unknown_user_text: str = Field(
        default="", description="Text for unknown user on home page"
    )

    not_allowed_channel: str = Field(
        default="", description="Message for unauthorized channel access"
    )

    # this stuff is only required for summer of making, but it's easier to keep it here :p
    dm_magic_link_no_user: str = Field(
        default=":rac_cute: heya, please provide the user you want me to dm",
        description="Message when no user provided for magic link DM",
    )

    dm_magic_link_error: str = Field(
        default="", description="Error message for magic link generation"
    )

    dm_magic_link_success: str = Field(
        default=":rac_cute: magic link sent! tell em to check their dms with me :D",
        description="Success message for magic link DM",
    )

    dm_magic_link_message: str = Field(
        default=":rac_cute: hey there! i got told that you got a bit stuck so here's a magic link for ya :D\n{magic_link}",
        description="Magic link DM message",
    )

    dm_magic_link_no_permission: str = Field(
        default="", description="No permission message for magic link command"
    )

    @model_validator(mode="after")
    def set_default_messages(self):
        """Set default values for messages that reference other fields"""
        if not self.first_ticket_create:
            self.first_ticket_create = f"""oh, hey (user) it looks like this is your first time here, welcome! someone should be along to help you soon but in the mean time i suggest you read the faq <{self.faq_link}|here>, it answers a lot of common questions.
if your question has been answered, please hit the button below to mark it as resolved
    """

        if not self.ticket_create:
            self.ticket_create = f"""someone should be along to help you soon but in the mean time i suggest you read the faq <{self.faq_link}|here> to make sure your question hasn't already been answered. if it has been, please hit the button below to mark it as resolved :D
    """

        if not self.ticket_resolve:
            self.ticket_resolve = f"""oh, oh! it looks like this post has been marked as resolved by <@{{user_id}}>! if you have any more questions, please make a new post in <#{self.help_channel}> and someone'll be happy to help you out! not me though, i'm just a silly racoon ^-^
    """

        if not self.ticket_resolve_stale:
            self.ticket_resolve_stale = f""":rac_nooo: it looks like this post is a bit old! if you still need help, please make a new post in <#{self.help_channel}> and someone'll be happy to help you out! ^~^
        """

        if not self.home_unknown_user_text:
            self.home_unknown_user_text = f"heyyyy, heidi here! it looks like i'm not allowed to show ya this. sorry! if you think this is a mistake, please reach out to <@{self.program_owner}> and she'll lmk what to do!"

        if not self.not_allowed_channel:
            self.not_allowed_channel = f"heya, it looks like you're not supposed to be in that channel, pls talk to <@{self.program_owner}> if that's wrong"

        if not self.dm_magic_link_error:
            self.dm_magic_link_error = f":rac_nooo: something went wrong while generating the magic link, please bug <@{self.program_owner}> (status: {{status}})"

        if not self.dm_magic_link_no_permission:
            self.dm_magic_link_no_permission = f":rac_nooo: you don't have permission to use this command, please bug <@{self.program_owner}> if you think this is a mistake"

        return self
