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

import logging

from gsuite_exporter import auth

LOGGER = logging.getLogger(__name__)

class AdminReportsAPIFetcher(object):
    """Fetch Admin SDK Reports API records and streams them.

    Args:
        api (`googleapiclient.discovery.Resource`): The Admin SDK API to fetch
            records from.
        gsuite_admin (str): The GSuite admin email to impersonate.
        credentials_path (str): The path to the service account credentials.
    """
    SCOPES = [
        'https://www.googleapis.com/auth/admin.reports.audit.readonly',
    ]
    REPORTS_API_VERSION = 'v1'
    def __init__(self, gsuite_admin, credentials_path=None):
        self.api_name = 'reports_{}'.format(
            AdminReportsAPIFetcher.REPORTS_API_VERSION)

        LOGGER.debug("Initializing Admin API '%s' ...", self.api_name)
        self.api = auth.build_service(
            api='admin',
            version=self.api_name,
            credentials_path=credentials_path,
            user_email=gsuite_admin,
            scopes=AdminReportsAPIFetcher.SCOPES)

    def fetch(self, application, start_time, user_key='all', item_key='items'):
        """Fetch records from Admin API based on a query.

        Args:
            application (str): The application name.
            start_time (str): The start timestamp to start fetching from.
            user_key (str): The user filter.
            item_key (str): The enveloppe name to extract data from.

        Yields:
            list: A list of entries in each response.
        """
        activities = self.api.activities()
        req = activities.list(
            applicationName=application,
            userKey=user_key,
            startTime=start_time
        )
        while req is not None:
            res = req.execute()
            items = res.get(item_key, [])
            LOGGER.debug("Retrieved %s new Admin API records from '%s.%s' app since %s",
                         len(items),
                         self.api_name,
                         application,
                         start_time)
            yield items
            req = activities.list_next(
                previous_request=req,
                previous_response=res)
