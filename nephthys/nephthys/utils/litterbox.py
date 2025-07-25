import logging
from typing import Literal

import aiohttp

from nephthys.utils.env import env


async def upload_litter(
    file: bytes,
    filename: str,
    expiry: Literal["1h", "12h", "24h", "72h"],
    content_type: str,
) -> str | None:
    api = "https://litterbox.catbox.moe/resources/internals/api.php"
    data = aiohttp.FormData()
    data.add_field("reqtype", "fileupload")
    data.add_field("fileToUpload", file, filename=filename, content_type=content_type)
    data.add_field("time", expiry)
    async with env.session.post(api, data=data) as resp:
        if resp.status != 200:
            logging.error(
                f"Failed to upload image: {resp.status} - {await resp.text()}"
            )
            return None
        url = await resp.text()
    return url
