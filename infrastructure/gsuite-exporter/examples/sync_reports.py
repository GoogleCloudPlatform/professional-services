import pprint
import os
from gsuite_exporter.cli import sync_all

if __name__ == '__main__':

    APPLICATIONS = [
        'login',
        'admin',
        'drive',
        'mobile',
        'token'
    ]
    for app in APPLICATIONS:
        sync_all(
            "<user>@<domain>.rocks",
            app,
            "<project-id>",
            "stackdriver_exporter.StackdriverExporter"
        )
