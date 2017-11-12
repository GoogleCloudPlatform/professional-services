import configparser
import enum


class LoadJobType(enum.Enum):
    DEMO = "DEMO"


class Config:
    postgres_config_section_name = 'Postgres'
    airflow_config_section_name = 'AIRFLOW'

    def __init__(self, filename, job_type):
        config = configparser.RawConfigParser()
        config.read(filename)
        config_section_name = job_type

        # Schema and data file directories
        self.schema_name = config.get(config_section_name, 'schema_name')
        self.gcs_schema_folder = config.get(config_section_name, 'gcs_schema_uri')
        self.gcs_data_folder = config.get(config_section_name, 'gcs_data_uri')
        self.local_schema_dir = config.get(config_section_name, 'staging_schema_local_dir')
        self.local_data_dir = config.get(config_section_name, 'staging_data_local_dir')
        self.table_file_local = config.get(config_section_name, 'staging_table_list_local_dir')
        self.table_file_gcs = config.get(config_section_name, 'gcs_table_list_uri')
        self.projectID = config.get(config_section_name, 'project_id')
        self.src_bigquery_dataset_name = config.get(config_section_name, 'bigquery_dataset_name')
        self.dest_bigquery_dataset_name = config.get(config_section_name, 'bigquery_dataset_view_name')
        self.db_connection_id = config.get(self.postgres_config_section_name, 'airflow_connection_id')
        self.job_pool = config.get(self.airflow_config_section_name, 'job_pool')