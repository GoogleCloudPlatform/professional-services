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

from resources.organization import Organization
from resources.project import Project
from resources.billing_account import BillingAccount
from resources.gcs_bucket import GcsBucket
from resources.bigquery_dataset import BqDataset
from resources.folder import Folder

ALL_RESOURCES_IN_PROCESSING_ORDER = [
    GcsBucket,
    Project,
    BqDataset,
    Folder,
    BillingAccount,
    Organization,
]

ORGANIZATION_NAME = "mydomain.com"
MATCHER_EXPRESSION = rf"user:(.*)%{ORGANIZATION_NAME}@gtempaccount.com"
FORMAT_MATCHER = lambda match: "user:{name}@{org}".format(
    name=match.group(1), org=ORGANIZATION_NAME
)
