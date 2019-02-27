import datetime
import re


def get_start_date(date_value):
    """
    Takes value from DAG config and generates valid start_date. Defaults to
    today, if not a valid date or relative time (1 hours, 1 days, etc.)

    :param date_value: either a datetime or a relative time
    :param timezone: string value representing timezone for the DAG
    :returns: datetime.datetime for start_date
    """

    if isinstance(date_value, datetime.date):
        return datetime.datetime.combine(
            date_value, datetime.datetime.min.time()
        ).replace(tzinfo=None)
    if isinstance(date_value, datetime.datetime):
        return date_value.replace(tzinfo=None)
    rel_delta = get_time_delta(date_value)
    now = (
        datetime.datetime.today()
        .replace(hour=0, minute=0, second=0, microsecond=0)
        .replace(tzinfo=None)
    )
    if not rel_delta:
        return now
    return now - rel_delta


def get_time_delta(time_string):
    """
    Takes a time string (1 hours, 10 days, etc.) and returns
    a python timedelta object

    :param time_string: the time value to convert to a timedelta
    :returns: datetime.timedelta for relative time
    """
    rel_time = re.compile(
        r"((?P<hours>\d+?)\s+hour)?((?P<minutes>\d+?)\s+minute)?((?P<seconds>\d+?)\s+second)?((?P<days>\d+?)\s+day)?",  # noqa
        re.IGNORECASE,
    )
    parts = rel_time.match(time_string)
    if not parts:
        raise Exception(f"Invalid relative time: {time_string}")
    parts = parts.groupdict()
    time_params = {}
    if all(value == None for value in parts.values()):
        raise Exception(f"Invalid relative time: {time_string}")
    for name, param in parts.items():
        if param:
            time_params[name] = int(param)
    return datetime.timedelta(**time_params)


def merge_configs(config, default_config):
    """
    Merges a `default` config with DAG config. Used to set default values
    for a group of DAGs.

    :param config: config to merge in default values
    :param default_config: config to merge default values from
    :returns: dict with merged configs
    """
    for key in default_config:
        if key in config:
            if isinstance(config[key], dict) and isinstance(default_config[key], dict):
                merge_configs(config[key], default_config[key])
        else:
            config[key] = default_config[key]
    return config
