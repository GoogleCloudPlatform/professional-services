class GoogleCloudStorageHook:

    def __init__(self,
                 google_cloud_storage_conn_id='google_cloud_default',
                 delegate_to=None):
        # super(GoogleCloudStorageHook, self).__init__(google_cloud_storage_conn_id,
        #                                              delegate_to)
        print("initializing class GoogleCloudStorageHook")

    def list(self, bucket, versions=None, maxResults=None, prefix=None, delimiter=None):

        file_list=["data/shipment/pending_shipment/pending_shipment.csv","data/shipment/completed_shipment/shipment_details.csv"]
        return file_list

        