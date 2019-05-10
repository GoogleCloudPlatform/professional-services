from google.cloud import bigtable
import json

def bigtable_label_updater(projectid, resourceid, tags):
    client = bigtable.client.Client(project=projectid, admin=True)
    instances = client.list_instances()

    instance = None;
    # scan for the instance with resourceid
    for x in instances:
        if x is not None:
            for y in x:
                if y is not None and y.instance_id == resourceid:
                    instance = y
                    break
    # if instance was not found in the list above
    if instance is None:
        instance = client.instance(resourceid)

    # create or get labels dict to be updated with tags
    if instance.labels is None:
        labels = dict()
    else:
        labels = instance.labels

    # update labels with tags
    for key, value in tags.items():
        labels[key] = value

    # assign the labels back to instance
    instance.labels = labels

    # make update
    instance.update()
