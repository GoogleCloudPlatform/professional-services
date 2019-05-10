from google.cloud import bigquery
import ConfigParser

def bigquery_label_updater(config_file, projectid, resourceid, tags):
    parser = ConfigParser.SafeConfigParser()
    parser.read(config_file)
    key_file = parser.get('property', 'key_file')
    client = bigquery.Client.from_service_account_json(key_file)

    datasetid = projectid + '.' + resourceid
    datasetref = bigquery.dataset.DatasetReference.from_string(datasetid)

    dataset = client.get_dataset(datasetref)
    labels = dataset.labels
    # if 'labels' not in dataset:
    #     dataset.labels = dict()

    for key, value in tags.items():
        dataset.labels[key] = value

    dataset = client.update_dataset(dataset, ['labels'])
    return dataset
