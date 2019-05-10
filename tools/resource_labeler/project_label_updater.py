from apiclient.discovery import build
import httplib2
import access_setup
import ConfigParser
import logging

logging.getLogger('googleapiclient.discovery_cache').setLevel(logging.ERROR)

def project_label_updater(config_file, projectid, tags):
        # credentials = access_setup.access_set_up(config_file)
        # http = access_setup.access_set_up(config_file)
        #credentials.authorize(http)
        parser = ConfigParser.SafeConfigParser()
        parser.read(config_file)
        try:
            key_file = parser.get('property', 'key_file')
        except ConfigParser.NoOptionError:
            logging.error("Please Provide Service Account Key File")
            print "Please Provide Service Account Key File"
            exit(1)

        scope = ['https://www.googleapis.com/auth/cloud-platform',
                 'https://www.googleapis.com/auth/spreadsheets',
                 'https://www.googleapis.com/auth/drive']

        access_setup.os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = key_file

        try:
            credentials = access_setup.ServiceAccountCredentials.from_json_keyfile_name(key_file, scope)
        except:
            print "Key File Not Found"
            exit(1)

        http = httplib2.Http()
        credentials.authorize(http)

        crm = build('cloudresourcemanager', 'v1', http=http)
        project = crm.projects().get(projectId=projectid).execute()
        logging.info ("Project is found")

        if 'labels' not in project:
            project['labels'] = dict()

        for key, value in tags.items():
            project['labels'][key] = value

        logging.info ("Updating Project")

        project = crm.projects().update(
            projectId=projectid, body=project).execute()

        return project

