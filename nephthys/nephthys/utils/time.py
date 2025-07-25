from datetime import datetime
from datetime import timezone

from astral import LocationInfo
from astral.geocoder import database
from astral.geocoder import lookup
from astral.sun import sun


def is_day(tz: timezone):
    """
    Check if it is daytime in the given timezone.

    Args:
        tz (timezone): The timezone to check.

    Returns:
        bool: True if it is daytime, False otherwise.
    """

    now = datetime.now(tz)

    # extract city from tz string
    try:
        tz_name = str(tz)
        if "/" in tz_name:
            city = tz_name.split("/")[-1].replace("_", " ")
            try:
                location_result = lookup(city, database())
                if hasattr(location_result, "locations"):
                    location = list(location_result.locations.values())[0]
                else:
                    location = location_result
            except KeyError:
                location = LocationInfo("Default", "Default", "UTC", 0, 0)
        else:
            location = LocationInfo("Default", "Default", "UTC", 0, 0)
    except Exception:
        location = LocationInfo("Default", "Default", "UTC", 0, 0)

    s = sun(location.observer, date=now.date(), tzinfo=tz)

    # check if current time is between sunrise and sunset
    sunrise = s["sunrise"]
    sunset = s["sunset"]

    return sunrise <= now <= sunset
