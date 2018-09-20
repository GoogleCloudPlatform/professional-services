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
            "ocervello@ricknmorty.rocks",
            app,
            "rnm-shared-devops",
            "stackdriver_exporter.StackdriverExporter",
            credentials_path=os.environ['GOOGLE_APPLICATION_CREDENTIALS']
        )
