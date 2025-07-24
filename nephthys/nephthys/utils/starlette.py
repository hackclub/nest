from slack_bolt.adapter.starlette.async_handler import AsyncSlackRequestHandler
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.responses import RedirectResponse
from starlette.routing import Route

from nephthys.__main__ import main
from nephthys.api.stats import stats
from nephthys.utils.env import env
from nephthys.utils.slack import app as slack_app

req_handler = AsyncSlackRequestHandler(slack_app)


async def endpoint(req: Request):
    return await req_handler.handle(req)


async def health(req: Request):
    try:
        await env.slack_client.api_test()
        slack_healthy = True
    except Exception:
        slack_healthy = False

    db_healthy = env.db.is_connected()

    return JSONResponse(
        {
            "healthy": slack_healthy,
            "slack": slack_healthy,
            "database": db_healthy,
        }
    )


async def root(req: Request):
    return RedirectResponse(url="https://github.com/hackclub/nephthys")


app = Starlette(
    debug=True if env.environment != "production" else False,
    routes=[
        Route(path="/", endpoint=root, methods=["GET"]),
        Route(path="/slack/events", endpoint=endpoint, methods=["POST"]),
        Route(path="/api/stats", endpoint=stats, methods=["GET"]),
        Route(path="/health", endpoint=health, methods=["GET"]),
    ],
    lifespan=main,
)
