import os

from aiohttp import ClientSession
from dotenv import load_dotenv
from slack_sdk.web.async_client import AsyncWebClient

from nephthys.transcripts import transcripts
from nephthys.transcripts.transcript import Transcript
from prisma import Prisma

load_dotenv(override=True)


class Environment:
    def __init__(self):
        self.slack_bot_token = os.environ.get("SLACK_BOT_TOKEN", "unset")
        self.slack_user_token = os.environ.get("SLACK_USER_TOKEN", "unset")
        self.slack_signing_secret = os.environ.get("SLACK_SIGNING_SECRET", "unset")
        self.slack_app_token = os.environ.get("SLACK_APP_TOKEN")

        self.uptime_url = os.environ.get("UPTIME_URL")
        self.site_url = os.environ.get("SITE_URL", "https://summer.hackclub.com")
        self.site_api_key = os.environ.get("SITE_API_KEY", "unset")

        self.environment = os.environ.get("ENVIRONMENT", "development")
        self.slack_help_channel = os.environ.get("SLACK_HELP_CHANNEL", "unset")
        self.slack_ticket_channel = os.environ.get("SLACK_TICKET_CHANNEL", "unset")
        self.slack_bts_channel = os.environ.get("SLACK_BTS_CHANNEL", "unset")
        self.slack_user_group = os.environ.get("SLACK_USER_GROUP", "unset")
        self.slack_maintainer_id = os.environ.get("SLACK_MAINTAINER_ID", "unset")
        self.program = os.environ.get("PROGRAM", "summer_of_making")

        self.port = int(os.environ.get("PORT", 3000))

        self.slack_heartbeat_channel = os.environ.get("SLACK_HEARTBEAT_CHANNEL")

        unset = [key for key, value in self.__dict__.items() if value == "unset"]

        if unset:
            raise ValueError(f"Missing environment variables: {', '.join(unset)}")

        transcript_instances = [program() for program in transcripts]
        valid_programs = [
            program.program_snake_case for program in transcript_instances
        ]
        if self.program not in valid_programs:
            raise ValueError(
                f"Invalid PROGRAM environment variable: {self.program}. "
                f"Must be one of {valid_programs}"
            )

        self.session: ClientSession
        self.db = Prisma()
        self.transcript = next(
            (
                program
                for program in transcript_instances
                if program.program_snake_case == self.program
            ),
            Transcript(),
        )

        self.slack_client = AsyncWebClient(token=self.slack_bot_token)


env = Environment()
