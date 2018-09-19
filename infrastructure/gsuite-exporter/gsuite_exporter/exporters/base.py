class BaseExporter(object):
    """Convert Admin SDK logs to logging entries and sends them to an export
    destination.

    Args:
        api (`googleapiclient.discovery.Resource`): The Admin SDK API to fetch
            records from.
        version (str): The Admin SDK API version.
        credentials_path (str): The path to the GSuite Admin credentials.
        scopes (list): A list of scopes to grant the API requests.
    """

    def __init__(self,
                 project_id,
                 destination_name,
                 credentials_path):
        raise NotImplementedError()

    def send(self, records, dry=False):
        """Writes a list of Admin SDK records to the export destination.

        Args:
            records (list): A list of log records.
            dry (bool): Toggle dry-run mode (default: False).

        Raises:
            `NotImplementedError`: Method is implemented in a derived class.
        """
        raise NotImplementedError()

    def convert(self, records):
        """Convert a bunch of Admin API records to the destination format.

        Args:
            records (list): A list of Admin API records.

        Raises:
            `NotImplementedError`: Method is implemented in a derived class.
        """
        raise NotImplementedError()

    @property
    def last_timestamp(self):
        """Last timestamp synced.

        Raises:
            `NotImplementedError`: Method is implemented in a derived class.
        """
        raise NotImplementedError()
