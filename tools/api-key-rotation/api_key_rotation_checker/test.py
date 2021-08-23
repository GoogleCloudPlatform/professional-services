#!/usr/bin/env python3

import googleapiclient.discovery # pylint: disable=import-error
from googleapiclient.errors import HttpError # pylint: disable=import-error
from googleapiclient.discovery_cache.base import Cache # pylint: disable=import-error
import logging


def main():
    service = create_service()

    create_project_list(service)

def create_service():
    """
    Creates the GCP Cloud Resource Service.
    """
    return googleapiclient.discovery.build(
        "cloudresourcemanager",
        "v1",
        cache=MemoryCache())

def create_project_list(service):
    """
    Get our project list from GCP.

    Args:

    service - A resource manager service created via create_service() function
    """

    logging.info(
        "Getting GCP project list. This may take a minute.. \n")

    # Collect all the projects
    projects = []

    # Paginate through the list of all available projects
    request = service.projects().list()
    try:
        response = request.execute()
        projects.extend(response.get("projects", []))
    except HttpError as err:
        logging.error(err)

    return projects

class MemoryCache(Cache):
    """
    File-based cache to resolve GCP noisey log entries.
    """
    _CACHE = {}

    def get(self, url):
        return MemoryCache._CACHE.get(url)

    def set(self, url, content):
        MemoryCache._CACHE[url] = content


if __name__ == "__main__":
    main()
