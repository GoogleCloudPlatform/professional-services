#    Copyright 2022 Google LLC

#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at

#        http://www.apache.org/licenses/LICENSE-2.0

#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.

from google.cloud import asset_v1
from google.protobuf.json_format import MessageToDict
import click
import time
import json


def all_iam_policies(org_id, as_dict=True):
    policies = []
    scope = "organizations/{org_id}".format(org_id=org_id)
    click.secho(
        "Fetching IAM Policies from CAI API using scope {scope}".format(
            scope=scope
        )
    )
    client = asset_v1.AssetServiceClient()
    response = client.search_all_iam_policies(
        request={
            "scope": scope,
            "page_size": 500,
        }
    )
    for policy in response:
        if as_dict:
            policies.append(MessageToDict(policy.__class__.pb(policy)))
        else:
            policies.append(policy)
    return policies


def fetch_cai_file(org_id):
    if not org_id:
        raise SystemExit(
            "ERROR: No org id provided. Set the ORG_ID environment variable or pass the --org-id parameter."
        )
    all_policies = all_iam_policies(org_id)
    timestamp = int(time.time())
    filename = "cai-iam-{timestamp}.json".format(timestamp=timestamp)
    f = open(filename, "w")
    json.dump(all_policies, f)
    click.secho("Created inventory file {filename}.".format(filename=filename))
    return filename