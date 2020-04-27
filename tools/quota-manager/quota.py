#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Copyright 2020 Google Inc. All Rights Reserved.
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

__author__ = "yunusd@google.com (Yunus Durmus)"

from google.oauth2 import service_account
from googleapiclient import discovery
import time
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class Updater:
    """Updates the project quotas via API calls.

    GCP quota update is possible via console or APIs.
    Here we explain how to achieve quota updates via APIs programmatically.
    Service Quota model is explained in
    https://cloud.google.com/service-usage/docs/service-quota-model
    The details of quota update mechanism can be found in
    https://cloud.google.com/service-usage/docs/manage-quota
    The rest api reference is in https://cloud.google.com/service-usage/docs/reference/rest

    Briefly; each service has a unique name/parent to identify it.
    Each quota limit has a default value for all consumers,
    set by the service owner.
    This default value can be changed by a quota override.
    So when you update a quota, in fact you simply create a
     "consumerOverride" or "adminOverride".
     adminOverride should be done from a parent folder
     or organization while consumer is per project.
     In this class we only use consumerOverride since many quotas are project
     specific, not folder or org level.
     How they relate is explained in
     https://cloud.google.com/service-usage/docs/service-quota-model#computing_quota_limit
     Details of adminOverride:
     https://cloud.google.com/service-usage/docs/reference/rest/v1beta1/services.consumerQuotaMetrics.limits.adminOverrides/create

    The override operation is asynchronous so we poll the callback
    "operation" api to see the outcome. This class polls the operation for
    a minute. Mostly in 5-10 seconds it is done.

    The service account that runs this code should have
    roles/serviceusage.serviceUsageAdmin role on the project.
    """

    def __init__(self, project_id: str, credential_path: str, quota_name: str):
        """Initializes the class

        Args:
            project_id: id or number of the project to be updated
            credential_path: relative or absolute path of the
               JSON key for the service account with
               roles/serviceusage.serviceUsageAdmin role
            quota_name: the name of the quota. If you don't know,
               pass an empty string and then call "get_all_consumer_quota_metrics"
               method with the api such as compute.googleapis.com. You should
               find the name under 'consumerQuotaLimits'
               For instance BigQuery project quota name is:
              projects/YOUR_PROJECT_ID/services/bigquery.googleapis.com/consumerQuotaMetrics/bigquery.googleapis.com%2Fquota%2Fquery%2Fusage/limits/%2Fd%2Fproject
        """
        self.__project_id = project_id
        self.__quota_name = quota_name
        self.__credential_path = Path(credential_path)

        credentials = service_account.Credentials.from_service_account_file(
            self.__credential_path.absolute())

        scoped_credentials = credentials.with_scopes(
            ["https://www.googleapis.com/auth/cloud-platform"])

        self.__service_usage = discovery.build(
            "serviceusage",
            "v1beta1",
            credentials=scoped_credentials,
            cache_discovery=False,
        )

    def get_all_consumer_quota_metrics(self,
                                       service_name="bigquery.googleapis.com"):
        """prints all the quotas of a service

        This is a helper function to figure out the name of the metrics.
        Later you provide the names to the Updater class.

        Args:
            service_name: the api address of a service
        """

        import pprint

        parent = "projects/{}/services/{}".format(self.__project_id,
                                                  service_name)
        pprint.pprint(
            self.__service_usage.services().consumerQuotaMetrics().list(
                parent=parent).execute())

    def __get_current_overrides(self):
        return (self.__service_usage.services().consumerQuotaMetrics().limits().
                consumerOverrides().list(parent=self.__quota_name).execute())

    def get_current_quota(self):
        return (
            self.__service_usage.services().consumerQuotaMetrics().limits().get(
                name=self.__quota_name).execute())

    def __create_new_quota(self, new_quota, dimensions={}):
        logger.info(
            f"Project={self.__project_id}, creating a new quota of {new_quota}")
        return (self.__service_usage.services().consumerQuotaMetrics().limits().
                consumerOverrides().create(parent=self.__quota_name,
                                           force=True,
                                           body={
                                               "overrideValue": str(new_quota),
                                               "dimensions": dimensions
                                           }).execute())

    def __patch_existing_quota(self,
                               new_quota,
                               consumer_override,
                               dimensions={}):
        logger.info(
            f"Project={self.__project_id},patching existing quota with {new_quota}"
        )
        return (self.__service_usage.services().consumerQuotaMetrics().limits().
                consumerOverrides().patch(name=consumer_override,
                                          force=True,
                                          body={
                                              "overrideValue": str(new_quota),
                                              "dimensions": dimensions
                                          }).execute())

    def __check_operation_status(self, name):
        return self.__service_usage.operations().get(name=name).execute()

    def update_quota(self, new_quota: str, dimensions={}):
        """Updates the quota.

        First checks whether there is already an update, which is called override.
        If there is an override, we patch it. Otherwise we create a new override.

        The create and patch calls return an operation object. We track that object
        for 1 minute max. We record the outcome either error or success.

        Args:
            new_quota: the new quota value in string.
        Returns:
            outcome: a dictionary showing the result of the operation

        """
        curr_overrides = self.__get_current_overrides()
        logger.info(
            f"Project={self.__project_id}, current overrides: {curr_overrides}")
        operation = {}

        if not curr_overrides:
            operation = self.__create_new_quota(new_quota, dimensions)
        else:
            operation = self.__patch_existing_quota(
                new_quota, curr_overrides["overrides"][0]["name"], dimensions)

        for i in range(1, 12):
            outcome = self.__check_operation_status(operation["name"])
            if "error" in outcome:
                logger.error(
                    (f"Project={self.__project_id}, Could not update the quota."
                     f" Error message is: {outcome['error']}"))
                return outcome

            elif "response" in outcome:
                logger.info(
                    f"Project={self.__project_id}, update is successful. {outcome['response']}"
                )
                return outcome
            else:
                time.sleep(5.0)
        logger.warn((f"Project={self.__project_id},"
                     f"Operation={operation['name']} still continues,"
                     " please check the outcome manually later on. "))
