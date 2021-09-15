# Copyright 2021 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Util functions to parse yaml config data."""

from src.common.utils import common_utils


class Error(Exception):
    """Base exception class for all errors in this module."""
    pass  # pylint:disable=unnecessary-pass


class ConfigPathNotFoundError(Error):
    """Error thrown when config data file is missing."""
    pass  # pylint:disable=unnecessary-pass


class ConfigEmptyError(Error):
    """Error thrown when control config data is missing."""
    pass  # pylint:disable=unnecessary-pass


class ConfigValueError(Error):
    """Error thrown when control config data is missing."""
    pass  # pylint:disable=unnecessary-pass


# pylint:disable=too-few-public-methods
class _Config:
    """Object to hold yaml config information."""
    def __init__(self, data):
        """Initialize the config object.

        Args:
          data (dict): config data as dict object.
        """
        self._data = data

    def value(self, path, default=None):
        """Return value from yaml data for a given path str.

        Args:
            path: str, ex: export.pubsub.topic
            default: obj, value to be returned if no path does not exist.

        Returns:
            value at the given path in the yaml file.
        """
        parts = path.split('.')
        current = self._data
        val = default
        try:
            for part in parts:
                val = current.get(part)
                current = val
        except AttributeError as err:
            if default:
                val = default
            else:
                raise ConfigValueError('%s not found in config.yaml' %
                                       path) from err
        return val


# pylint:enable=too-few-public-methods


def config(config_filepath):
    """Process yaml at config_filepath and return an object.

    Args:
      config_filepath(str): file path for the config file.

    Returns:
      object, _Config object.

    Raises:
      ConfigEmptyError: If the config does not contain control config.
    """
    data = common_utils.process_yaml(config_filepath)
    if not data:
        raise ConfigEmptyError('Config: is empty')
    return _Config(data)
