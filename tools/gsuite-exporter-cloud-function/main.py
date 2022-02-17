# Copyright 2020 Google LLC
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
"""GSuite Exporter on Cloud Function"""

import os
from gsuite_exporter.cli import sync_all


def sync_log(event, context):
    """A PubSub handler trigger by Cloud Function"""

    del event, context

    admin = os.getenv('ADMIN_USER')
    project_id = os.getenv('GCP_PROJECT')
    if not admin:
        raise ValueError('Env variable `ADMIN_USER` is not set.')
    if not project_id:
        raise ValueError('Env variable `GCP_PROJECT` is not set.')

    sync_all(admin_user=admin,
             api='reports_v1',
             applications=['admin', 'login', 'drive', 'token', 'mobile'],
             project_id=project_id,
             exporter_cls='stackdriver_exporter.StackdriverExporter',
             offset=15)


if __name__ == '__main__':
    sync_log(None, None)
