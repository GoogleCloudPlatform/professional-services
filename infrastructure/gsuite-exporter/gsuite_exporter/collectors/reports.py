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
import sys
import time
import math
import logging
import dateutil.parser
from gsuite_exporter import auth

logger = logging.getLogger(__name__)

class AdminReportsAPIFetcher(object):
    """Fetch Admin SDK Reports API records and streams them.

    Args:
        api (`googleapiclient.discovery.Resource`): The Admin SDK API to fetch
            records from.
        version (str): The Admin SDK API version.
        credentials_path (str): The path to the GSuite Admin credentials.
        scopes (list): A list of scopes to grant the API requests.
    """
    SCOPES = [
        'https://www.googleapis.com/auth/admin.reports.audit.readonly',
    ]
    REPORTS_API_VERSION = 'v1'
    def __init__(self, gsuite_admin, credentials_path=None):
        self.api_name = 'reports_{}'.format(
            AdminReportsAPIFetcher.REPORTS_API_VERSION)

        logger.debug("Initializing Admin API '{}' ...".format(
            self.api_name))
        self.api = auth.build_service(
            api='admin',
            version=self.api_name,
            credentials_path=credentials_path,
            user_email=gsuite_admin,
            scopes=AdminReportsAPIFetcher.SCOPES)

    def fetch(self, application, start_time, user_key='all', item_key='items'):
        """Fetch records from Admin API based on a query.

        Args:
            api_query (dict): The request arguments as as dict.

        Yields:
            list: A list of entries in each response
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
            logger.debug("Retrieved {} new Admin API records from '{}.{}' app since {}".format(
                len(items),
                self.api_name,
                application,
                start_time))
            yield items
            req = activities.list_next(
                previous_request=req,
                previous_response=res)
