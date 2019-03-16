#!/usr/bin/env python
#
# Copyright 2019 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Convert CAI Assets to match API names.

There are some Cloud Asset Inventory (CAI) properties which don't match the
properties in the API discovery documents. This converts those CAI properties to
match those in the API. The property mappings are supplied by
the 'cai_to_api_mapping.json' configuration file which needs to be
regenerated if new properties are added to assets that don't aren't mapped
correctly.

The entrypoint is the `CAIToAPI.cai_to_api_properties` method.

"""

import json
import os


class CAIToAPI(object):
    """Convert CAI properties names to API properties."""

    _cai_to_api_dict = None

    @classmethod
    def _get_cai_to_api_properties(cls):
        """Get the dict containing current mappings."""
        # To regnerate the configs see:
        # https://colab.corp.google.com/drive/183eM8uKO0V-HD2ldx7AMJ8H6UQnh3JHt
        if cls._cai_to_api_dict is None:
            with open(os.path.join(os.path.dirname(__file__),
                                   'cai_to_api_properties.json')) as f:
                cls._cai_to_api_dict = json.load(f)
        return cls._cai_to_api_dict

    @classmethod
    def _apply_cai_to_api(cls, cai_properties, cai_to_api):
        """Recursively map CAI to API properties.

        Args:
            cai_properties: dict of cai properties at current level of
            recursion.
            cai_to_api: dict of cai to api mappings for the current level of
            recursion.
        """
        # `cai_properties is either a list of dicts or a dict.
        # if a list, apply for each dict in the list.
        if isinstance(cai_properties, list):
            for item in cai_properties:
                cls._apply_cai_to_api(item, cai_to_api)
            return

        # if a dict, recurse into each property that requires modification
        for cai_property in cai_to_api:
            if cai_property in cai_properties:
                cls._apply_cai_to_api(cai_properties[cai_property],
                                      cai_to_api[cai_property])

        # and apply the necessary modifications.
        if 'cai_to_api_names' in cai_to_api:
            cai_to_api_names = cai_to_api['cai_to_api_names']
            for cai_property, r_property  in cai_to_api_names.items():
                if cai_property in cai_properties:
                    cai_properties[r_property] = cai_properties.pop(
                        cai_property)

    @classmethod
    def cai_to_api_properties(cls, resource_name, cai_properties):
        """Convert CAI properties that should match API properties."""
        cai_to_api_properties = cls._get_cai_to_api_properties()
        if resource_name in cai_to_api_properties:
            cai_to_api = cai_to_api_properties[resource_name]
            cls._apply_cai_to_api(cai_properties, cai_to_api)
        return cai_properties
