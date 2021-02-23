import logging
class GoogleCloudStorageCustomHook:
    """
    Mocked for testing 
    Interact with Google Cloud Storage. This hook uses the Google Cloud Platform
    connection.
    """
    def __init__(self,
                 google_cloud_storage_conn_id="google_cloud_default",
                 delegate_to=None):
            google_cloud_storage_conn_id=google_cloud_storage_conn_id
            
    def create_file(
        self,
        bucket,
        filepath,
        filename,
        filecontent):
        """
        Writes contents provided to a GCS file
        :param bucket(string):
            name of bucket in which file will be created
        :param filename(string):
            path within the bucket where file will be created
        :param filename(string):
            name of the file to be created
        :param filecontent(string):
            data to be written into the file
        :return (string) absolute name of the file created
        """
        logging.debug(
            f"""printing arguments:
            bucket: {bucket}, filepath: {filepath},
            filename: {filename}, filecontent: {filecontent}
            """)

        abs_filename = f"{filepath}{filename}"
        logging.debug(f"abs_filename: {abs_filename}")
        with open(abs_filename, "w") as f:
            f.write(filecontent)
        f.close()

        return abs_filename

    def read_file(self,bucket,abs_file_path):
        """
        Reads contents to the GCS file
        :param bucket(string):
            bucket where file is located
        :param abs_file_path(string):
            absolute name of file to be read
        :return (string) file content
        """

        with open(abs_file_path) as f:
            data = json.loads(f)      
        f.close()  
        return data
