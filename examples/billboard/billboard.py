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

from google.cloud import bigquery
from google.cloud import billing
from google.api_core.exceptions import PermissionDenied
from google.cloud.exceptions import NotFound
import argparse
import sys
from colorama import Back
from colorama import Style

bq_client = bigquery.Client()

base_url = "https://datastudio.google.com/reporting/create?"
report_part_url = base_url + "c.reportId=2e2ea000-8f68-40e2-8847-b80f05069b6e"
report_base_url = report_part_url + "&r.reportName=MyBillboard"

std_proj_url = "&ds.ds39.connector=bigQuery&ds.ds39.projectId={}"
std_table_url = "&ds.ds39.type=TABLE&ds.ds39.datasetId={}&ds.ds39.tableId={}"
standard_view_url = std_proj_url + std_table_url

dtl_proj_url = "&ds.ds93.connector=bigQuery&ds.ds93.projectId={}"
dtl_table_url = "&ds.ds93.type=TABLE&ds.ds93.datasetId={}&ds.ds93.tableId={}"
detailed_view_url = dtl_proj_url + dtl_table_url

output_url = ""
isDetailedExportDifferentLocation = False
detailedBBDataset = ""


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

    try:
        standard_table_info = bq_client.get_table(standard_source_id)
        print("Exported {} in GEO Location={}".format(
            standard_source_id, standard_table_info.location))
        # Create dataset for BB for standard export.
        dataset_id = "{}.{}".format(args.PROJECT_ID,
                                    args.BILLBOARD_DATASET_NAME_TO_BE_CREATED)
        create_dataset_by_location(dataset_id, standard_table_info.location)
    except NotFound:
        print(
            "Table {} is not found please check the export and proceed.".format(
                standard_source_id))
        sys.exit()

    try:
        detailed_table_info = bq_client.get_table(detailed_source_id)
        print("Exported {} in GEO Location={}".format(
            detailed_source_id, detailed_table_info.location))
        # Check if detailed export is in different location.
        if standard_table_info.location != detailed_table_info.location:
            detailedBBDataset = '{}_detail'.format(
                args.BILLBOARD_DATASET_NAME_TO_BE_CREATED)
            dataset_id = "{}.{}".format(args.PROJECT_ID, detailedBBDataset)
            print(
                "Creating another dataset {} based on detailed export location".
                format(dataset_id))
            create_dataset_by_location(dataset_id, detailed_table_info.location)
    except NotFound:
        print(
            "Table {} is not found please check the export and proceed.".format(
                detailed_source_id))
        sys.exit()


# Creates billboard dataset based on billing exported location
# Location is taken from the billing export table provided by the user.
def create_dataset_by_location(dataset_id, location):
    # Check if billboard dataset exists
    if check_billboard_dataset_exists(dataset_id) is True:
        return
    # Since we need to create, construct a full Dataset object to send to the API.
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
    CREATE VIEW if not exists `{}`
    AS select *, COALESCE((SELECT SUM(x.amount) FROM UNNEST(s.credits) x),0) AS credits_sum_amount, COALESCE((SELECT SUM(x.amount) FROM UNNEST(s.credits) x),0) + cost as net_cost, EXTRACT(DATE FROM _PARTITIONTIME) AS date from `{}` s WHERE _PARTITIONTIME >'2020-08-01'
    """.format(view_id, source_id)

    # Not sure why this need project_id
    bq_view_client = bigquery.Client(project=args.PROJECT_ID)

    job = bq_view_client.query(sql)  # API request.
    job.result()  # Waits for the query to finish.

    if isStandard is True:
        output_url = report_base_url + standard_view_url.format(
            args.PROJECT_ID, args.BILLBOARD_DATASET_NAME_TO_BE_CREATED,
            args.bb_standard)
    else:
        output_url = output_url + detailed_view_url.format(
            args.PROJECT_ID, detailedBBDataset, args.bb_detailed)

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

    parser = argparse.ArgumentParser(description='Billing Export information')
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
                        type=str)

    parser.add_argument('-bb',
                        dest='BILLBOARD_DATASET_NAME_TO_BE_CREATED',
                        type=str,
                        required=True)

    parser.add_argument('-clean',
                        dest='clean',
                        type=str,
                        help='Only when you need cleanup, provide "yes"')

    args = parser.parse_args()
    if args.DETAILED_BILLING_EXPORT_DATASET_NAME is None:
        print("Detailed export not provided so setting default to Standard.")
        args.DETAILED_BILLING_EXPORT_DATASET_NAME = args.STANDARD_BILLING_EXPORT_DATASET_NAME

    # Detailed Export could be in different region so name will be modified as {}_detail in logic
    # So storing in global variable.
    detailedBBDataset = '{}'.format(args.BILLBOARD_DATASET_NAME_TO_BE_CREATED)

    project_id_temp = "projects/{}".format(args.PROJECT_ID)
    try:
        project_billing_info = billing.CloudBillingClient(
        ).get_project_billing_info(name=project_id_temp)
    except PermissionDenied:
        print(
            "Permission Denied so you do not have project level permission or provided wrong project id, please check."
        )
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
        create_billboard_view(args, False)  # to create detailed view
        generate_datastudio_url(args)  # to create urls
    else:
        remove_billboard_dataset(args)  # to cleanup


# Main entry point
if __name__ == "__main__":
    main(sys.argv[1:])
