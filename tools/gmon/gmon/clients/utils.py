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

from google.protobuf.json_format import MessageToDict
from typing import Set
import functools


def decorate_with(decorator, methods: Set[str]):
    def inner(cls):
        for attr in cls.__dict__:  # there's propably a better way to do this
            attribute = getattr(cls, attr)
            if callable(attribute) and attribute.__name__ in methods:
                setattr(cls, attr, decorator(attribute))
        return cls

    return inner


def to_json(func):
    @functools.wraps(func)
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
