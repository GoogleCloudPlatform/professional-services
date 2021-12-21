#    Copyright 2021 Google LLC

#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at

#        http://www.apache.org/licenses/LICENSE-2.0

#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.

import click
import json
import re
import csv
import time
import google.auth
import googleapiclient.discovery

try:
    from constants import (
        ALL_RESOURCES_IN_PROCESSING_ORDER,
        MATCHER_EXPRESSION,
        FORMAT_MATCHER,
    )
except:
    pass

from table_logger import TableLogger
from inventory import cai

log_headers = [
    "resource_type",
    "mapping_method",
    "resource",
    "role",
    "member_to_copy",
    "member_copy_result",
]

table_output = TableLogger(
    columns=",".join(log_headers),
    colwidth={
        "resource_type": 20,
        "mapping_method": 20,
        "resource": 20,
        "role": 30,
    },
    default_colwidth=50,
)


def look_for_gcloud_org():
    click.secho(
        "No --org-id provided. Trying gcloud config...",
    )
    try:
        creds, project_id = google.auth.default()
        client = googleapiclient.discovery.build(
            serviceName="cloudresourcemanager",
            version="v1",
            cache_discovery=False,
        )
        req = client.projects().getAncestry(projectId=project_id)
        resp = req.execute()

        find_org = next(
            filter(
                lambda r: r["resourceId"]["type"] == "organization",
                resp["ancestor"],
            )
        )
        org_id = find_org["resourceId"]["id"]
        click.secho(
            "Using {id} from gcloud config.".format(id=org_id),
        )
        return org_id
    except:
        raise SystemExit(
            ( 'Could not determine org id from gcloud config. Please either '
            'pass in the org id via --org-id or ensure your current gcloud '
            'configuration has an active project set.' )
        )


def parse_csv(file):
    with open(file, mode="r") as inp:
        reader = csv.reader(inp)
        next(reader, None)
        return {rows[0]: rows[1] for rows in reader}


@click.group()
def cli():
    pass


@cli.command()
@click.option("--org-id")
def generate_inventory_file(org_id):
    org_id_to_use = org_id if org_id else look_for_gcloud_org()
    cai.fetch_cai_file(org_id_to_use)


def should_keep_fix(member, manual_map, existing_bindings):
    match = re.match(MATCHER_EXPRESSION, member)
    new_member = None
    mapping_type = None
    if match:
        new_member = FORMAT_MATCHER(match)
        mapping_type = "Dynamic"

    strip_user = member.replace("user:", "")
    if strip_user in manual_map:
        new_member = "user:{email}".format(email=manual_map[strip_user])
        mapping_type = "Manual"

    if new_member in existing_bindings:
        return None

    if new_member and mapping_type:
        return [new_member, mapping_type]

    return None


def execute_iam_copy(resources, dry_run, verify_permissions):
    timestamp = int(time.time())
    filename = "out-{timestamp}.csv".format(timestamp=timestamp)
    f = open(filename, "a+", encoding="UTF8", newline="")
    writer = csv.writer(f)
    writer.writerow(log_headers)

    for (instance, bindings) in resources:
        for binding in bindings:
            iam_migrator = instance(
                binding["resource"],
                binding["role"],
                binding["new_member"],
                dry_run,
            )
            if verify_permissions:
                iam_migrator.verify_permissions()
            iam_migrator.migrate()
            writer.writerow(
                [
                    binding["type"],
                    binding["mapping_type"],
                    binding["resource"],
                    binding["role"],
                    binding["old_member"],
                    binding["new_member"],
                ]
            )

    click.secho(
        "Script Complete. {filename} created with output.".format(
            filename=filename
        ),
    )


@cli.command()
@click.option(
    "--filename",
    default=None,
)
@click.option("--dry-run", default=False)
@click.option("--map-file", default=None)
@click.option("--org-id", envvar="ORG_ID")
@click.option("--verify-permissions", default=True)
def run(filename, dry_run, map_file, org_id, verify_permissions):
    org_id = org_id if org_id else look_for_gcloud_org()
    if not map_file:
        click.secho(
            ( 'Notice: No manual mapper provided. To provide one '
            'set the --map-file parameter.\n' ),
            fg="yellow",
        )
    if not filename:
        click.secho(
            ( 'Notice: No filename provided. To provide one set the '
            '--filename parameter. Fetching inventory file...\n' ),
            fg="yellow",
        )
    manual_map = parse_csv(map_file) if map_file else {}
    assets = []
    asset_types = []
    file_to_open = filename if filename else cai.fetch_cai_file(org_id)
    f = open(file_to_open)
    cai_data = json.load(f)

    for resource in ALL_RESOURCES_IN_PROCESSING_ORDER:
        filter_resources = list(
            filter(
                lambda r: resource.ASSET_TYPE == r["assetType"],
                cai_data,
            )
        )

        click.secho(
            "Processing {count} resources of type {type}...".format(
                count=len(filter_resources), type=resource.ASSET_TYPE
            ),
            fg="blue",
        )
        new_assets = []
        for res in filter_resources:
            for binding in res["policy"]["bindings"]:
                for member in binding["members"]:
                    should_fix_member = should_keep_fix(
                        member, manual_map, binding["members"]
                    )

                    if should_fix_member is not None:
                        asset = {
                            "type": resource.ASSET_TYPE.split(
                                "googleapis.com/"
                            )[1],
                            "mapping_type": should_fix_member[1],
                            "resource": res["resource"],
                            "role": binding["role"],
                            "old_member": member,
                            "new_member": should_fix_member[0],
                        }
                        new_assets.append(asset)
        assets.extend(new_assets)

        # storing assets with the coresponding resource class to process later on
        if len(new_assets) > 0:
            asset_types.append((resource, new_assets))

        click.secho(
            "Found {count} tainted iam permissions on resource {type}... \n".format(
                count=len(new_assets), type=resource.ASSET_TYPE
            ),
            fg="yellow",
        )

    click.secho(
        "{count} total permissions to be copied".format(count=len(assets)),
        fg="green",
        bg="black",
    )
    for a in assets:
        table_output(*a.values())

    if dry_run:
        click.secho(
            "RUNNING AS DRY RUN. NO ACTUAL PERMISSIONS WILL BE TOUCHED.",
            fg="black",
            bg="green",
        )
    else:
        click.secho(
            ( '\n\nThis operation will copy the tainted iam permissions. '
            'There is no reversal operation. \n' ),
            fg="red",
        )

    if click.confirm("Are you sure you want to execute?"):
        execute_iam_copy(asset_types, dry_run, verify_permissions)


if __name__ == "__main__":
    cli()