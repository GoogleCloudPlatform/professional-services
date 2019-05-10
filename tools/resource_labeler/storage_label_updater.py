from google.cloud import storage

def storage_label_updater(resourceid, tags):
    storage_client = storage.Client()
    bucket_name = resourceid
    bucket = storage_client.get_bucket(bucket_name)

    labels = bucket.labels
    for key, value in tags.items():
        labels[key] = value

    bucket.labels = labels

    bucket.patch()
