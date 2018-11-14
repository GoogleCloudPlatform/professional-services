# Copyright 2017 Google Inc.
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

from google import auth


def _cache(f):
    """Decorator to cache return value of a function."""
    cached = {}

    def cached_function():
        """Cache return value in closure before calling function."""
        if 'value' not in cached:
            cached['value'] = f()
        return cached['value']

    return cached_function


@_cache
def get_project_id():
    """Return current project_id."""
    _, project_id = auth.default()
    return project_id
