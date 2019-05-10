from apiclient.discovery import build
import httplib2
import access_setup
import access_setup
import ConfigParser
import logging

def gce_label_updater(config_file, projectid, resourceid, zone, tags):
    try:
        #access_setup.access_set_up(config_file)

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

        crm_compute = build('compute', 'v1', http=http)
        instance = crm_compute.instances().get(project=projectid, instance=resourceid, zone=zone).execute()
    except Exception as inst:
        logging.warning(inst)
        #logging.warning(str(line) + '|' + str(inst))
        exit(1)

    if 'labels' not in instance:
        instance['labels'] = dict()

    for key, value in tags.items():
        instance['labels'][key] = value

    logging.info("Instance before update", instance)
    # instance.update()
    try:
        instance = crm_compute.instances().setLabels(
            project=projectid, instance=resourceid, body=instance, zone=zone).execute()
        logging.info("Compute engine updated successfully")
    except Exception as inst:
        logging.error(inst)
        exit(1)
    return instance