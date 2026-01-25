from typing import Annotated, Any
from datetime import datetime, timezone
from pydantic import BeforeValidator, PlainSerializer


def parse_and_ensure_utc(v: Any) -> datetime:
    """
    Accepts a string or datetime. 
    If it's a naive string (no timezone), assumes it is UTC.
    """
    if isinstance(v, str):
        try:
            v = datetime.fromisoformat(v)
        except ValueError:
            pass
            
    if isinstance(v, datetime):
        if v.tzinfo is None:
            v = v.replace(tzinfo=timezone.utc)
        return v
        
    raise ValueError("Invalid datetime format")

DbDatetime = Annotated[
    datetime,
    BeforeValidator(parse_and_ensure_utc),  # INPUT: Runs first when reading JSON
    PlainSerializer(                        # OUTPUT: Runs last when returning JSON
        lambda x: x.replace(microsecond=0, tzinfo=None).isoformat(sep=" "),
        return_type=str,
        when_used='json'                    # Only serialize to string for JSON API responses
    )
]
