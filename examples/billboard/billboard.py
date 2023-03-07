# Copyright 2022 Google LLC
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

from googleapiclient import discovery
from google.cloud import bigquery
from google.cloud import billing
from google.api_core import client_info as http_client_info
from google.api_core.exceptions import PermissionDenied
from google.cloud.exceptions import NotFound
import argparse
import sys
from colorama import Back
from colorama import Style

base_url = "https://lookerstudio.google.com/reporting/create?"
report_part_url = base_url + "c.reportId=64387229-05e0-4951-aa3f-e7349bbafc07"
report_base_url = report_part_url + "&r.reportName=MyBillboard"
report_base_url = report_base_url + "&ds.ds8.refreshFields=false"

std_proj_url = "&ds.ds8.connector=bigQuery&ds.ds8.projectId={}"
std_table_url = "&ds.ds8.type=TABLE&ds.ds8.datasetId={}&ds.ds8.tableId={}"
standard_view_url = std_proj_url + std_table_url

dtl_proj_url = "&ds.ds93.connector=bigQuery&ds.ds93.projectId={}"
dtl_table_url = "&ds.ds93.type=TABLE&ds.ds93.datasetId={}&ds.ds93.tableId={}"
detailed_view_url = dtl_proj_url + dtl_table_url

output_url = ""
isDetailedExportDifferentLocation = False
detailedBBDataset = ""

app_version = "3.0"

APPLICATION_NAME = "professional-services/billboard"
USER_AGENT = "{}/{}".format(APPLICATION_NAME, app_version)


# This is find code usage
def get_http_client_info():
    return http_client_info.ClientInfo(user_agent=USER_AGENT)


bq_client = bigquery.Client(client_info=get_http_client_info())


# This function checks if billboard dataset already exists or not
# so that we are not recreating it
def check_billboard_dataset_exists(dataset_id):
    try:
        bq_client.get_dataset(dataset_id)  # Make an API request.
        print("Dataset {} already exists.".format(dataset_id))
        return True
    except NotFound:
        print("Dataset {} is not found.".format(dataset_id))
        return False


# Creates billboard dataset.
# Location is taken from the billing export table provided by the user.
def create_dataset(args):

    global detailedBBDataset
    standard_source_id = "{}.{}.{}".format(
        args.PROJECT_ID, args.STANDARD_BILLING_EXPORT_DATASET_NAME,
        args.standard_table)

    detailed_source_id = "{}.{}.{}".format(
        args.PROJECT_ID, args.DETAILED_BILLING_EXPORT_DATASET_NAME,
        args.detailed_table)

    standard_table_info = None
    detailed_table_info = None

    print("Creating standard Dataset.")
    try:
        standard_table_info = bq_client.get_table(standard_source_id)
        print("Exported {} in GEO Location={}".format(
            standard_source_id, standard_table_info.location))
        # Create dataset for BB for standard export.
        dataset_id = "{}.{}".format(args.PROJECT_ID,
                                    args.BILLBOARD_DATASET_NAME_TO_BE_CREATED)
        create_dataset_by_loc(dataset_id, standard_table_info.location)
    except NotFound:
        print("Table {} is not found check the export and proceed.".format(
            standard_source_id))
        # Standard is mandatory so program will fail if doesnot exists.
        sys.exit()

    if args.DETAILED_BILLING_EXPORT_DATASET_NAME is None:
        return True

    print("Creating detailed Dataset.")

    try:
        detailed_table_info = bq_client.get_table(detailed_source_id)
        print("Exported {} in GEO Location={}".format(
            detailed_source_id, detailed_table_info.location))
        # Check if detailed export is in different location.
        if standard_table_info.location != detailed_table_info.location:
            detailedBBDataset = '{}_detail'.format(
                args.BILLBOARD_DATASET_NAME_TO_BE_CREATED)
            dataset_id = "{}.{}".format(args.PROJECT_ID, detailedBBDataset)
            print("Creating another dataset {} in detailed export loc".format(
                dataset_id))
            create_dataset_by_loc(dataset_id, detailed_table_info.location)

    except NotFound:
        print("Table {} is not found check the export.".format(
            detailed_source_id))
        # Skip failing if detailed is not there.
        # sys.exit()


# Creates billboard dataset based on billing exported location
# Location is taken from the billing export table provided by the user.
def create_dataset_by_loc(dataset_id, location):
    # Check if billboard dataset exists
    if check_billboard_dataset_exists(dataset_id) is True:
        return
    # Since we need to create, construct a full
    # Dataset object to send to the API.
    dataset = bigquery.Dataset(dataset_id)
    dataset.location = location
    # Send the dataset to the API for creation, with an explicit timeout.
    # Raises google.api_core.exceptions.Conflict if the Dataset already
    # exist within the project.
    # Make an API request.
    dataset = bq_client.create_dataset(dataset, timeout=30)
    print("Created dataset {} on location {}".format(dataset_id, location))


# Creates the view for the Billboard
def create_billboard_view(args, isStandard):

    global output_url
    global detailedBBDataset

    if isStandard is True:
        source_id = "{}.{}.{}".format(args.PROJECT_ID,
                                      args.STANDARD_BILLING_EXPORT_DATASET_NAME,
                                      args.standard_table)
        view_id = "{}.{}.{}".format(args.PROJECT_ID,
                                    args.BILLBOARD_DATASET_NAME_TO_BE_CREATED,
                                    args.bb_standard)
    else:
        source_id = "{}.{}.{}".format(args.PROJECT_ID,
                                      args.DETAILED_BILLING_EXPORT_DATASET_NAME,
                                      args.detailed_table)
        view_id = "{}.{}.{}".format(args.PROJECT_ID, detailedBBDataset,
                                    args.bb_detailed)

    print('source_id={} and view_id={}'.format(source_id, view_id))

    # Standard -Fail view creation & url construct if standard is missing
    # Detailed -Skip view creation & url construct if detailed is missing.
    try:
        bq_client.get_table(source_id)
    except NotFound:
        if isStandard is True:
            print("Standard usage cost export not found=" + source_id +
                  " so skipping billboard view creation")
            sys.exit()
        else:
            print("Detailed usage cost export not found=" + source_id +
                  " so skipping billboard detailed view creation")
        return

    sql = """
    CREATE OR REPLACE VIEW  `{}`
    AS select *,
    COALESCE((SELECT SUM(x.amount)
    FROM UNNEST(s.credits) x),0) AS credits_sum_amount,
    COALESCE((SELECT SUM(x.amount)
    FROM UNNEST(s.credits) x),0) + cost as net_cost,
    PARSE_DATE("%Y%m", invoice.month) AS Invoice_Month,
    _PARTITIONDATE AS date
    from `{}` s
    WHERE _PARTITIONDATE > DATE_SUB(CURRENT_DATE(), INTERVAL 13 MONTH)
    """.format(view_id, source_id)

    # Not sure why this need project_id
    bq_view_client = bigquery.Client(project=args.PROJECT_ID)

    job = bq_view_client.query(sql)  # API request.
    job.result()  # Waits for the query to finish.

    if isStandard is True:
        output_url = report_base_url + standard_view_url.format(
            args.PROJECT_ID, args.BILLBOARD_DATASET_NAME_TO_BE_CREATED,
            args.bb_standard)
    # not using detailed datasource yet so commenting
    # else:
    #     output_url = output_url + detailed_view_url.format(
    #         args.PROJECT_ID, detailedBBDataset, args.bb_detailed)

    print('Created view {}{}.{}.{}'.format(Back.GREEN, job.destination.project,
                                           job.destination.dataset_id,
                                           job.destination.table_id))
    print(Style.RESET_ALL)


def generate_datastudio_url(args):
    print(
        "To view dataset, please click " + Back.GREEN +
        "https://console.cloud.google.com/bigquery", "\n")

    print(Style.RESET_ALL)

    print("To launch datastudio report, please click " + Back.GREEN +
          output_url + "\n")
    print(Style.RESET_ALL)


def remove_billboard_dataset(args):
    standard_view_id = "{}.{}.{}".format(
        args.PROJECT_ID, args.BILLBOARD_DATASET_NAME_TO_BE_CREATED,
        args.bb_standard)
    bq_client.delete_table(standard_view_id, not_found_ok=True)
    print("Billboard view {} deleted.".format(standard_view_id))
    detailed_view_id = "{}.{}.{}".format(
        args.PROJECT_ID, args.BILLBOARD_DATASET_NAME_TO_BE_CREATED,
        args.bb_detailed)
    bq_client.delete_table(detailed_view_id, not_found_ok=True)
    print("Billboard view {} deleted.".format(detailed_view_id))
    return True


def main(argv):

    global detailedBBDataset
    parser = argparse.ArgumentParser(
        description='Billing Export information, Version=' + app_version)
    parser.add_argument('-v',
                        action='version',
                        version='Version of %(prog)s ' + app_version)

    parser.add_argument('-pr',
                        dest='PROJECT_ID',
                        type=str,
                        help='Project Id',
                        required=True)
    parser.add_argument('-se',
                        dest='STANDARD_BILLING_EXPORT_DATASET_NAME',
                        type=str,
                        required=True)
    parser.add_argument('-de',
                        dest='DETAILED_BILLING_EXPORT_DATASET_NAME',
                        type=str,
                        required=True)

    parser.add_argument('-bb',
                        dest='BILLBOARD_DATASET_NAME_TO_BE_CREATED',
                        type=str,
                        required=True)

    parser.add_argument('-clean',
                        dest='clean',
                        type=str,
                        help='Only when you need cleanup, provide "yes"')

    args = parser.parse_args()
    print('Version of billboard.py  ' + app_version + "\n")

    # if args.DETAILED_BILLING_EXPORT_DATASET_NAME is None:
    # print("Detailed export not provided so setting default to Standard.")
    # args.DETAILED_BILLING_EXPORT_DATASET_NAME
    # = args.STANDARD_BILLING_EXPORT_DATASET_NAME

    # Detailed Export could be in different region
    # so name will be modified as {}_detail in logic
    # So we are storing in global variable.
    detailedBBDataset = '{}'.format(args.BILLBOARD_DATASET_NAME_TO_BE_CREATED)

    project_id_temp = "projects/{}".format(args.PROJECT_ID)

    # Check if billing api is enabled.
    # service = discovery.build('serviceusage', 'v1')
    # request = service.services().get(
    #     name=f"{project_id_temp}/services/cloudbilling.googleapis.com")
    # response = request.execute()
    # if response.get('state') == 'DISABLED':
    #     print("Cloud Billing API is not enabled.")
    #     return sys.exit(1)

    try:
        project_billing_info = billing.CloudBillingClient(
        ).get_project_billing_info(name=project_id_temp)
    except PermissionDenied:
        print("Permission Denied, check project level permission.")
        return sys.exit(1)

    billing_account_name = project_billing_info.billing_account_name.split(
        "/")[1]

    print("Project billing account=" + billing_account_name, "\n")
    args.standard_table = "gcp_billing_export_v1_" + \
        billing_account_name.replace('-', '_')
    args.detailed_table = "gcp_billing_export_resource_v1_" + \
        billing_account_name.replace('-', '_')
    args.bb_standard = "billboard"
    args.bb_detailed = "billboard_detail"

    if args.clean is None:
        create_dataset(args)  # to create dataset
        create_billboard_view(args, True)  # to create standard view
        # if args.DETAILED_BILLING_EXPORT_DATASET_NAME is not None:
        create_billboard_view(args, False)  # to create detailed view
        generate_datastudio_url(args)  # to create urls
    else:
        remove_billboard_dataset(args)  # to cleanup


# Main entry point
if __name__ == "__main__":
    main(sys.argv[1:])
