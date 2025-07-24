import logging

from thefuzz import fuzz
from thefuzz import process

from nephthys.utils.env import env


async def get_tags(payload: dict) -> list[dict[str, dict[str, str] | str]]:
    tags = await env.db.tag.find_many()
    if not tags:
        return []

    keyword = payload.get("value")
    if keyword:
        tag_names = [tag.name for tag in tags]
        scores = process.extract(keyword, tag_names, scorer=fuzz.ratio, limit=100)
        old_tags = tags

        tags = [old_tags[tag_names.index(score[0])] for score in scores]
    res = [
        {
            "text": {"type": "plain_text", "text": f"{tag.name}"},
            "value": str(tag.id),
        }
        for tag in tags
    ]
    logging.info(res)
    return res
