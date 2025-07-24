import asyncio
import contextlib
import logging
from datetime import datetime

import uvicorn
from aiohttp import ClientSession
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from dotenv import load_dotenv
from starlette.applications import Starlette

from nephthys.tasks.close_stale import close_stale_tickets
from nephthys.tasks.daily_stats import send_daily_stats
from nephthys.tasks.update_helpers import update_helpers
from nephthys.utils.delete_thread import process_queue
from nephthys.utils.env import env
from nephthys.utils.logging import send_heartbeat

load_dotenv()

try:
    import uvloop

    asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())
except ImportError:
    pass

logging.basicConfig(level="INFO" if env.environment != "production" else "WARNING")


@contextlib.asynccontextmanager
async def main(_app: Starlette):
    await send_heartbeat(":neodog_nom_verified: Bot is online!")
    async with ClientSession() as session:
        env.session = session
        await env.db.connect()

        scheduler = AsyncIOScheduler(timezone="Europe/London")
        scheduler.add_job(send_daily_stats, "cron", hour=0, minute=0)
        scheduler.add_job(
            close_stale_tickets,
            "interval",
            hours=1,
            max_instances=1,
            next_run_time=datetime.now(),
        )
        scheduler.start()

        delete_msg_task = asyncio.create_task(process_queue())
        await update_helpers()
        handler = None
        if env.slack_app_token:
            if env.environment == "production":
                logging.warning(
                    "You are currently running Socket mode in production. This is NOT RECOMMENDED - you should set up a proper HTTP server with a request URL."
                )
            from slack_bolt.adapter.socket_mode.async_handler import (
                AsyncSocketModeHandler,
            )
            from nephthys.utils.slack import app as slack_app

            handler = AsyncSocketModeHandler(slack_app, env.slack_app_token)
            logging.info("Starting Socket Mode handler")
            await handler.connect_async()

        logging.info(f"Starting Uvicorn on port {env.port}")

        yield
        scheduler.shutdown()
        delete_msg_task.cancel()

        if handler:
            logging.info("Stopping Socket Mode handler")
            await handler.close_async()


def start():
    uvicorn.run(
        "nephthys.utils.starlette:app",
        host="0.0.0.0",
        port=env.port,
        log_level="info" if env.environment != "production" else "warning",
        reload=env.environment == "development",
    )


if __name__ == "__main__":
    start()
