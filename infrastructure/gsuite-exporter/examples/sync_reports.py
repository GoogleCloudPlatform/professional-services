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
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'],
            "ocervello@ricknmorty.rocks",
            app,
            "rnm-forseti-dev-opencensus",
            "stackdriver_exporter.StackdriverExporter"
        )
