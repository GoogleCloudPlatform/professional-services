#!/usr/bin/env python

# Copyright 2017 Google Inc. All Rights Reserved.
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
import argparse
from quotareport import QuotaReporter
from quotareport import QuotaMetricRecorder
from oauth2client.service_account import ServiceAccountCredentials
import json
import gcpinventory
import logging

logging.basicConfig(level=logging.INFO)

def main():

    parser = argparse.ArgumentParser(description='Report GCE project quotas')
    parser.add_argument('monitor_project',
                        help='project to record quota report')
    parser.add_argument('--keyfile',
                        help='project to receive quota report', default=None)
    parser.add_argument('--project',
                        help='project to report quota on', default=None)



    args = parser.parse_args()

    if args.keyfile is not None:
        credentials = ServiceAccountCredentials.from_json_keyfile_name(args.keyfile)
    else:
        credentials = None

    gcpinventory.sync_gcp_service_routes(args.project, "gcp-service-route", 2000, "default", "default-internet-gateway",
                                apply_changes=False, credentials=credentials)

    gcpinventory.sync_gcp_service_routes(args.project, "gcp-service-route", 2000, "default", "default-internet-gateway",
                                apply_changes=True, credentials=credentials)
    return

    reporter = QuotaReporter(credentials)
    recorder = QuotaMetricRecorder(args.monitor_project, credentials)

    if args.project is not None:
        quotas = reporter.get_project_quotas(args.project)
        recorder.record_project_quotas(args.project, quotas)
    else:
        quotas = reporter.iter_all_quotas()
        for q in quotas:
            recorder.record_project_quotas(q["projectId"], q["quotas"])

if __name__ == '__main__':
    main()
