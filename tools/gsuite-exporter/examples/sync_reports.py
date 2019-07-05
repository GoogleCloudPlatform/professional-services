# Copyright 2018 Google Inc.
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

import os
from gsuite_exporter.cli import sync_all

if __name__ == '__main__':
    sync_all(
        admin_user='<gsuite_admin>@<domain>',
        api='reports_v1',
        applications=['login', 'admin', 'drive', 'mobile', 'token'],
        project_id='<logging_project_id>',
        exporter_cls='stackdriver_exporter.StackdriverExporter',
        credentials_path=os.environ['GOOGLE_APPLICATION_CREDENTIALS']
    )
