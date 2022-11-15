#!/usr/bin/env python
#
# Copyright 2022 Google Inc.
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
"""
    Currently when logging API is enabled in a project it creates
    two log buckets: _Required and _Default.These log buckets are
    created in a Global region, and customers with data locality restriction
    may not want to store their logs in a Global location.
    https://cloud.google.com/logging/docs/routing/overview#buckets

    This behaviour can be changed by setting an organization level setting
    that restricts the log bucket creation to a specefic region.
    However, these settings are applied only for any newly created projects
    and doesn't change the log bucket location for existing projects.
    https://cloud.google.com/logging/docs/default-settings

    In some cases, customers may not have set these organization level setting
    and would want to change the log bucket's location to a specific region.

    P.S: _Required log bucket region can NOT be changed once they are created.

    This utility helps in reconfiguring the _Default sink to send logs to a
    newly created regional Default bucket.

    There are 2 parts to this utility:
        1. list_all_projects --> This function takes an Organization ID and
            scans through all the folders and sub folders to generate a list
            of projects within the organization
        2. create_bucket_update_sink --> This function takes a list of projects
            and reconfigures the _Default sink

    If you already have a list of projects where you want to reconfigure the
    _Default sink, you can disable project listing by setting
    "list_projects = False" in user_inputs.py

    Permissions and Roles Required: The principal running the utility needs
    the below roles attached to them at the organization level.
        1. roles/resourcemanager.organizationViewer
        2. roles/resourcemanager.folderViewer
        3. roles/logging.admin
"""

from collections import deque
import logging
from pathlib import Path
import errno
import os
import time

from google.cloud import resourcemanager_v3
from google.cloud.logging_v2.types import logging_config
from google.cloud.logging_v2.services.config_service_v2 import ConfigServiceV2Client

from user_inputs import (
    log_bucket_region,
    log_bucket_name,
    organization_id,
    list_projects,
    exclude_folders,
    exclude_projects,
    projectListFile,
    log_level,
)

# Logger configurations
logger = logging.getLogger(__name__)
logger.setLevel(level=log_level)
console_handler = logging.StreamHandler()
console_handler.setFormatter(
    logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
)
logger.addHandler(console_handler)


def create_default_bucket(logging_client, project_id, region, bucket_id):
    """A wrapper to create log buckets.
    Args:
        logging_client: An instance of ConfigServiceV2Client from logging_v2
        project_id: Project ID where the log bucket needs to be created
        region: Region where the regional log bucket has to be created
        bucket_id: Name of the log bucket to be created.

    Returns:
        Bool representing the status of log bucket creation.
    """
    parent = "projects/" + project_id + "/locations/" + region
    client = logging_client
    logger.info("Creating bucket:: Parent= %s, LogBucketName= %s", parent, bucket_id)
    create_log_bucket_request = logging_config.CreateBucketRequest(
        parent=parent, bucket_id=bucket_id
    )
    try:
        create_log_bucket_response = client.create_bucket(
            request=create_log_bucket_request
        )
        logger.debug(create_log_bucket_response)
        logger.info(
            "Successfully Created Log Bucket:: %s, Project:: %s",
            create_log_bucket_response.name,
            project_id,
        )
        return True
    except Exception as e:
        logger.error(e)
        logger.error("Error creating log bucket:: %s", parent)
        return False


def update_sink(logging_client, project_id, region, bucket_id):
    """A wrapper to update sink, this will reconfigure the _Default sink
    with the newly created regional bucket.

    Args:
        logging_client: An instance of ConfigServiceV2Client from logging_v2
        project_id: Project ID where _Default sink needs to be reconfigured
        region: Region of the newly created log bucket
        bucket_id: name of the newly created log bucket

    Returns:
        Bool representing the status of sink update
    """

    client = logging_client
    filter = 'NOT LOG_ID("cloudaudit.googleapis.com/activity") AND NOT LOG_ID("externalaudit.googleapis.com/activity") AND NOT LOG_ID("cloudaudit.googleapis.com/system_event") AND NOT LOG_ID("externalaudit.googleapis.com/system_event") AND NOT LOG_ID("cloudaudit.googleapis.com/access_transparency") AND NOT LOG_ID("externalaudit.googleapis.com/access_transparency")'
    sink_name = "projects/" + project_id + "/sinks/_Default"
    destination = (
        "logging.googleapis.com/projects/"
        + project_id
        + "/locations/"
        + region
        + "/buckets/"
        + bucket_id
    )
    sink = logging_config.LogSink(
        name=sink_name, destination=destination, filter=filter
    )
    update_sink_request = logging_config.UpdateSinkRequest(
        sink_name=sink_name, sink=sink, unique_writer_identity=True
    )
    try:
        update_sink_response = client.update_sink(request=update_sink_request)
        logger.debug(update_sink_response)
        logger.info(
            "Successfully updated Sink:: %s, New Destination:: %s",
            update_sink_response.name,
            update_sink_response.destination,
        )
        return True
    except Exception as e:
        logger.error(e)
        logger.error("Error updating sink to new bucket for project:: %s", project_id)
        return False


def create_bucket_update_sink(
    logging_client, projectListFile, log_bucket_region, log_bucket_name
):
    """This function iterates over the list of projects and creates
    new regional logbuckets and then reconfigures the _Default sink to
    point to the newly created log bucket.

    Args:
        logging_client: An instance of ConfigServiceV2Client from logging_v2
        projectListFile: The file that contains the list of projects.
                        Check sample_projectid.txt for the format.
        log_bucket_region: Region where new log bucket needs to be created
        log_bucket_name: Name of the new log bucket to be created

    Returns: None
    """
    projectsList = Path(projectListFile)
    if projectsList.exists():
        with projectsList.open("r") as projects:
            for project in projects:
                _create_bucket = create_default_bucket(
                    logging_client, project.strip(), log_bucket_region, log_bucket_name
                )
                if _create_bucket:
                    update_sink(
                        logging_client,
                        project.strip(),
                        log_bucket_region,
                        log_bucket_name,
                    )
                else:
                    logger.error(
                        "Create log bucket failed for project:: %s, _Default Sink is not updated",
                        project.strip(),
                    )
    else:
        raise FileNotFoundError(
            errno.ENOENT, os.strerror(errno.ENOENT), str(projectsList)
        )
    return


def list_all_projects(
    folders_client,
    projects_client,
    organization_id,
    file_projects,
    file_folders,
    exclude_projects,
    exclude_folders,
):
    """Lists all projects and folders in the given organization.
    Outputs 2 files in the current working directory:
    projects-%timestamp%.txt --> Contains all the projects
    folders-%timestamp%.txt --> Contains all the folders

    Args:
        folders_client: An instance of resourcemanager_v3.FoldersClient
        projects_client: An instance of resourcemanager_v3.ProjectsClient
        organization_id: Organization ID
        file_projects: Path to output file that contains projects
        file_folders: Path to output file that contains folders
        exclude_projects: set of projects to exclude from listing
        exclude_folders: set of folders to exluding from listing

    Returns:
        file_projects: Path to output file that contains projects
    """

    logger.info("List project start")

    parentsToList = deque()  # holds list of folders to iterate
    parents_list_info = (
        []
    )  # holds final list of folders including org to generate output file.
    projects_list = []  # holds final list of projects
    org_parent = "organizations/" + organization_id
    parentsToList.append(org_parent)
    parents_list_info.append(org_parent)

    logger.info("Organization ID: %s", org_parent)

    while parentsToList:
        parentId = parentsToList.pop()
        try:
            logger.debug("Listing folders under the parent: %s", parentId)
            list_folder_request = resourcemanager_v3.ListFoldersRequest(
                parent=parentId, page_size=10
            )
        except Exception as e:
            logger.error(e)
        list_folder_response = folders_client.list_folders(request=list_folder_request)

        try:
            logger.debug("Listing projects under the parent: %s", parentId)
            list_projects_request = resourcemanager_v3.ListProjectsRequest(
                parent=parentId, page_size=10
            )
        except Exception as e:
            logger.error(e)
        list_projects_response = projects_client.list_projects(
            request=list_projects_request
        )

        for folder in list_folder_response:
            if folder.name.split("/")[1] not in exclude_folders:
                parentsToList.append(folder.name)
                parents_list_info.append(folder.name)
            else:
                logger.info("%s in folder exclusion list", folder.name)

        for project in list_projects_response:
            if project.project_id not in exclude_projects:
                projects_list.append(project.project_id)
            else:
                logger.info("%s in project exclusion list", project.project_id)

    with open(file_folders, "w") as folders:
        folders.write("\n".join(parents_list_info))

    with open(file_projects, "w") as projects:
        projects.write("\n".join(projects_list))

    logger.info("Project File:: " + str(Path.cwd() / file_projects))
    logger.info("Folders File:: " + str(Path.cwd() / file_folders))
    logger.info(
        "Number of Parents: %s, Number of Projects: %s",
        str(len(parents_list_info)),
        str(len(projects_list)),
    )
    logger.info("End of list project")
    return file_projects


def main():
    """Main function"""

    current_time = time.strftime("%Y%m%d-%H%M%S")
    file_projects = (
        "projects-" + current_time + ".txt"
    )  # Project list file locaiton, output of list_all_projects
    file_folders = (
        "folders-" + current_time + ".txt"
    )  # Folder list file location, output of list_all_projects

    logging_client = ConfigServiceV2Client()
    folders_client = resourcemanager_v3.FoldersClient()
    projects_client = resourcemanager_v3.ProjectsClient()

    if list_projects:
        logger.info("list_projects is set to True")
        _projectListFile = list_all_projects(
            folders_client,
            projects_client,
            organization_id,
            file_projects,
            file_folders,
            exclude_projects,
            exclude_folders,
        )
        create_bucket_update_sink(
            logging_client, _projectListFile, log_bucket_region, log_bucket_name
        )
    else:
        logger.info(
            "list_projects is set to False, Input File for Project= %s", projectListFile
        )
        create_bucket_update_sink(
            logging_client, projectListFile, log_bucket_region, log_bucket_name
        )


if __name__ == "__main__":
    main()
