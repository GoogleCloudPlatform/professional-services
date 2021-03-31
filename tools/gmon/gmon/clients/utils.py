# Copyright 2020 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#            http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""
`utils.py`
Util functions.
"""

import functools
import json
import proto
from collections.abc import Iterable
from typing import Set

from google.protobuf.json_format import MessageToDict


def proto_message_to_dict(message: proto.Message) -> dict:
    """Helper method to parse protobuf message to dictionary.

    Args:
        message (`proto.Message`): Protobuf message.

    Returns:
        dict: Parsed protobuf message.
    """
    try:
        return json.loads(message.__class__.to_json(message))
    except AttributeError:  # message is not a response, it's a proto
        return MessageToDict(message)


def decorate_with(decorator, methods: Set[str]):
    """Class decorator that decorates wanted class methods.

    Args:
        decorator (method): Decorator method.
        methods (set): Set of class method names to decorate.

    Returns:
        cls: Decorated class.
    """

    def inner(cls):
        if not methods:
            return cls
        for attr in cls.__dict__:  # there's propably a better way to do this
            attribute = getattr(cls, attr)
            if callable(attribute) and attribute.__name__ in methods:
                setattr(cls, attr, decorator(attribute))
        return cls

    return inner


def to_json(func):
    """Format API responses as JSON, using protobuf.

    Args:
        func (method): Function to decorate.

    Returns:
        method: Decorated method.
    """

    @functools.wraps(func)
    def inner(*args, **kwargs):
        fields = kwargs.pop('fields', None)
        response = func(*args, **kwargs)
        if isinstance(response, Iterable):
            for resp in response:
                yield filter_fields(proto_message_to_dict(resp), fields=fields)
        elif response is None:
            yield None
        else:
            yield filter_fields(proto_message_to_dict(response), fields=fields)

    return inner


def filter_fields(response, fields: Set[str]):
    """Filter response fields.

    Args:
        response (dict): Response as a dictionary.
        fields (set): Set of fields to filter on.

    Returns:
        dict: Filtered response.
    """
    if fields is None:
        return response
    return {k: response[k] for k in response.keys() & fields}
