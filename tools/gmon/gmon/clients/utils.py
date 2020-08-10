"""
`utils.py`
Util functions.
"""

from google.protobuf.json_format import MessageToDict


def decorate(decorator, methods=[]):
    def inner(cls):
        for attr in cls.__dict__:  # there's propably a better way to do this
            attribute = getattr(cls, attr)
            if callable(attribute) and attribute.__name__ in methods:
                setattr(cls, attr, decorator(attribute))
        return cls

    return inner


def to_json(func):
    def inner(*args, **kwargs):
        fields = kwargs.pop('fields', None)
        res = func(*args, **kwargs)
        if isinstance(res, list):
            for r in res:
                yield filter_fields(MessageToDict(r), fields=fields)
        elif res is None:
            yield None
        else:
            yield filter_fields(MessageToDict(res), fields=fields)

    return inner


def filter_fields(response, fields=None):
    """Filter response fields.

    Args:
        response (dict): Response as a dictionary.
        fields (list): List of fields to filter on.

    Returns:
        dict: Filtered response.
    """
    if fields is None:
        return response
    return {k: v for k, v in response.items() if k in fields}
