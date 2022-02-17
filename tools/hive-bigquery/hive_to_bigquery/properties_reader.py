# Copyright 2019 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Properties Reader module."""


class PropertiesReader(object):
    """Properties reader to read properties from a dictionary."""

    properties = ''

    def __init__(self, config):
        PropertiesReader.properties = config

    def __str__(self):
        return PropertiesReader.properties

    @staticmethod
    def get(key):
        """Retrieve a value from the dictionary.

        Args:
            key (str): key name of the property.

        Returns:
            str: value of the property.
        """

        if key in PropertiesReader.properties:
            return PropertiesReader.properties[key]
        else:
            raise KeyError(
                "Key {} is not present in Properties Reader".format(key))
