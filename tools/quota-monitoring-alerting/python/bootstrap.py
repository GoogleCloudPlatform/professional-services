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
"""Bootstrap required setup."""

from src.common.utils import config_utils
from src.quota.handlers import reporting_handler


def run():
    """Bootstrap required setup for the given project id."""
    config = config_utils.config('config.yaml')
    host_project_id = config.value('project')
    reporting_handler.create_custom_metric_descriptors(host_project_id)


if __name__ == '__main__':
    run()
