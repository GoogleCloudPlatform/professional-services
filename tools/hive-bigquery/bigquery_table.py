import logging

from bigquery_table_model import BigQueryTableModel

logger = logging.getLogger('Hive2BigQuery')


class BigQueryTable:
    """Class to decide on how the Hive table should be translated in BigQuery
    
    Gets information of the Hive table from the HiveTableModel class and
    decides on the BigQuery table properties such as whether the table should
    be partitioned, partition column if any, whether the table should be
    clustered, clustering columns if any etc. and initialize the
    BigQueryTableModel wrapper class

    Attributes:
        dataset_id: BigQuery dataset ID
        table_name: BigQuery table name
        bq_table_model: Instance of BigQueryTableModel which contains the
        BigQuery table details

    """

    def __init__(self, dataset_id, table_name, hive_table_model):

        logger.info('Initializing BigQueryTable object')
        self.dataset_id = dataset_id
        self.table_name = table_name
        self.bq_table_model = self.initialize_bq_table_model(hive_table_model)

    def initialize_bq_table_model(self, hive_table_model):
        """Generates information about how BigQuery considers the Hive table

        Args:
            hive_table_model (:class:`HiveTableModel`): Wrapper to Hive table
                details

        Returns:
            BigQueryTableModel: Wrapper to BigQuery table details
        """

        clustering_columns = list()
        # Allowed data types in Hive for clustering in BigQuery
        hive_allowed_types = [
            'tinyint', 'smallint', 'int', 'bigint', 'decimal',
            'char', 'varchar', 'string', 'timestamp', 'date', 'boolean'
        ]
        # Sets to default values
        is_partitioned = False
        is_clustered = False
        partition_column = None

        # Finds if there are any partition columns present of type
        # timestamp/date in the Hive table
        for col in hive_table_model.partition_columns:
            if hive_table_model.partition_info[col] == "timestamp" or \
                    hive_table_model.partition_info[col] == "date":
                partition_column = col
                break

        # Gets a list of clustering columns, if any applicable
        if partition_column is not None:
            is_partitioned = True
            for col in hive_table_model.partition_columns:
                if (hive_table_model.partition_info[col] in hive_allowed_types
                        and col != partition_column):
                    clustering_columns.append(col)

        # Sets boolean to True if clustering columns list is not empty
        if clustering_columns:
            is_clustered = True

        bq_table_model = BigQueryTableModel(
            dataset_id=self.dataset_id,
            table_name=self.table_name,
            n_cols=hive_table_model.n_cols,
            is_partitioned=is_partitioned,
            is_clustered=is_clustered,
            data_format=hive_table_model.destination_data_format,
            partition_column=partition_column,
            clustering_columns=clustering_columns[:4])

        return bq_table_model
