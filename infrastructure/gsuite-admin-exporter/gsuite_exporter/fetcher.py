import os
import sys
import time
import math
import dateutil.parser
import constants
from utils import get_api

class AdminAPIFetcher(object):
    """Fetch Admin SDK API records and streams them.

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
    def __init__(self,
                 credentials_path,
                 token_path="",
                 api=constants.ADMIN_API_VERSION,
                 scopes=constants.DEFAULT_SCOPES):
        print("{} | Initializing Admin API ...".format(
            self.__class__.__name__))
        self.api = get_api(
            'admin',
            api,
            scopes,
            credentials_path,
            token_path)

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
            print("{} | Retrieved {} new Admin API records from '{}' app since {}".format(
                self.__class__.__name__,
                len(items),
                application,
                start_time))
            yield items
            req = activities.list_next(
                previous_request=req,
                previous_response=res)
