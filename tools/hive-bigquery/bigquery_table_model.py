import logging

logger = logging.getLogger('Hive2BigQuery')


class BigQueryTableModel:
    """Wrapper for resource describing a BigQuery table
    
    Bundles information of how Hive table will be considered when migrated to
    BigQuery, such as partitioning and clustering fields

    Attributes:
        dataset_id: BigQuery dataset ID
        table_name: BigQuery Table name
        n_cols: Number of columns in the table
        is_partitioned: A boolean indicating whether the table is partitioned
        is_clustered: A boolean indicating whether the table is clustered
        data_format: Format of the data to be loaded from GCS, which can be
            one of Avro, ORC, and Parquet
        partition_column: Partition column name of the table, if any
        clustering_columns: List of clustering columns names, if any, upto a
            maximum of 4 values
    """

    def __init__(self, **kwargs):
        logger.info('Initializing BigQueryTableModel object')
        self.dataset_id = kwargs['dataset_id']
        self.table_name = kwargs['table_name']
        self.n_cols = kwargs['n_cols']
        self.is_partitioned = kwargs['is_partitioned']
        self.is_clustered = kwargs['is_clustered']
        self.data_format = kwargs['data_format']
        self.partition_column = kwargs['partition_column']
        self.clustering_columns = kwargs['clustering_columns']

    def __str__(self):
        """Iterates over the attributes dictionary of BigQueryTableModel
        object and returns a string which contains all the attribute values"""

        model = 'BigQuery Table Model\n'
        for key, value in self.__dict__.iteritems():
            model += key + ' : ' + str(value) + '\n'
        return model
