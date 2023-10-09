# Copyright 2023 Google LLC. This software is provided as-is, without warranty
# or representation for any use or purpose. Your use of it is subject to your
# agreement with Google.

from dataclasses import dataclass, asdict
import json

__default_encoder = json.JSONEncoder().default


def json_encoder(obj):
    return getattr(obj.__class__, "__json__", __default_encoder)(obj)


@dataclass
class ProcessingConfig:
    """Data class containing processing configuration"""
    processing_bucket: str
    composer_bukcet: str
    validate_schema: bool
    user_managed_schema: bool
    file_arrival_interval: int
    processing_recheck_interval: int

    def __str__(self):
        return json.dumps(asdict(self), indent=4, sort_keys=False, default=str)

    def __json__(self):
        return asdict(self)


@dataclass
class SourceConfig:
    """Data class containing data source configuration"""
    landing_project_id: str
    landing_bucket: str
    source_format: str
    source_objects_prefix: str
    schema_file: str
    schema_version: str
    enforce_schema_version_detection: bool
    enforce_logical_date_detection: bool
    
    def __str__(self):
        return json.dumps(asdict(self), indent=4, sort_keys=False, default=str)

    def __json__(self, **options):
        return asdict(self)


@dataclass
class DestinationConfig:
    """Data class containing data destination configuration"""
    target_project_id: str
    dataset_id: str
    location: str
    store_bucket: str
    table_name: str
    ingestion_date_format: str
    extraction_date_regex: str
    native_csv_field_delimiter: str
    native_csv_skip_leading_rows: str
    native_csv_json_max_bad_records: str
    native_encoding: str
    native_partitioning_column: str
    native_partitioning_type: str
    native_time_partitioning_type: str
    native_range_partitioning_start: str
    native_range_partitioning_end: str
    native_range_partitioning_interval: str
    native_write_disposition: str
    native_create_disposition: str

    def __str__(self):
        return json.dumps(asdict(self), indent=4, sort_keys=False, default=str)

    def __json__(self, **options):
        return asdict(self)


@dataclass
class FeedConfig:
    """Data class containing dag configuration to be used by the dynamic dag generator"""
    dag_id: str
    schedule: str
    grouping_level1: str
    default_args: dict
    processing_config: ProcessingConfig
    source_config: SourceConfig
    destination_config: DestinationConfig

    def __str__(self):
        return json.dumps(asdict(self), indent=4, sort_keys=False, default=str)

    def __json__(self, **options):
        return asdict(self)
