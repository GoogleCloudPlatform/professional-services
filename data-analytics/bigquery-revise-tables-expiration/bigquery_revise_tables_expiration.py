# -*-coding=utf-8 -*-

import json

from apiclient.discovery import build
from datetime import datetime, date, time, timedelta
from oauth2client.client import GoogleCredentials

credentials = GoogleCredentials.get_application_default()

SERVICE_NAME = "bigquery"
SERVICE_VERSION = "v2"

PROJECT = [[YOUR-PROJECT]]
DATASET = [[YOUR-DATASET]]

EPOCH = datetime.utcfromtimestamp(0)
EXPIRATION_DAYS = +60
MIDNIGHT = datetime.combine(datetime.utcnow(), time.min)
NEW_EXPIRATION = long((MIDNIGHT + timedelta(days=EXPIRATION_DAYS) - EPOCH).total_seconds()) * 1000

service = build(
    SERVICE_NAME,
    SERVICE_VERSION,
    credentials=credentials
)

tables = service.tables()

tables_list_request = tables.list(
    projectId=PROJECT,
    datasetId=DATASET,
)
while tables_list_request is not None:
    tables_list_response = tables_list_request.execute()
    for table in tables_list_response["tables"]:
        tableId = table["tableReference"]["tableId"]
        creationTime = table["creationTime"]
        expirationTime = table["expirationTime"]
        if (NEW_EXPIRATION != long(expirationTime)):
            # Patch the table's expiration time to NEW_EXPIRATION
            tables_patch_request = tables.patch(
                projectId=PROJECT,
                datasetId=DATASET,
                tableId=tableId,
                body={
                    "expirationTime": NEW_EXPIRATION
                }
            )
            tables_patch_response = tables_patch_request.execute()
            patched = True
        else:
            patched = False
        print("{} {} {} -- {}".format(
            tableId,
            datetime.fromtimestamp(int(creationTime)/1000.0),
            datetime.fromtimestamp(int(expirationTime)/1000.0),
            "☒ - patched" if patched else "☑"
        ))
    tables_list_request = tables.list_next(
        tables_list_request,
        tables_list_response
    )
