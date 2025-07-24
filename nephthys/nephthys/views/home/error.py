def get_error_view(msg: str, traceback: str | None = None):
    if traceback:
        msg = f"{msg}\n\nTraceback:\n```{traceback}```"
    return {
        "type": "home",
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "Sorry, something went wrong. Please try again later.",
                },
            },
            {
                "type": "section",
                "text": {"type": "mrkdwn", "text": f"Error message\n{msg}"},
            },
        ],
    }
