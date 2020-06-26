# Copyright 2019 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Module to validate the requirements for data migration."""

import logging

from hive_to_bigquery.properties_reader import PropertiesReader

logger = logging.getLogger('Hive2BigQuery')
LOCATION_HELP_URL = "https://cloud.google.com/bigquery/docs/dataset-locations#data-locations"


class ResourceValidator(object):
    """Validates all the user provided resources.

    Validates the existence of resources such as Hive database, Hive table,
    GCS bucket, BigQuery dataset and also validates the compatibility between
    the GCS bucket location and BigQuery dataset location.
    """
    def __init__(self):
        pass

    @staticmethod
    def check_location_compatibility(bq_dataset_location, gcs_bucket_location):
        """Checks the compatibility of the BigQuery dataset location and GCS
        bucket location to support loading data.

        Args:
            bq_dataset_location (str): BigQuery dataset location.
            gcs_bucket_location (str): GCS bucket location.

        Returns:
            boolean: True if compatible, False if not.
        """

        # Update these locations if there are any new additions to BigQuery
        # locations.

        # List of BigQuery multi-regional locations.
        bq_multi_regional_locations = ['EU']

        # List of BigQuery regional locations.
        bq_regional_locations = [
            'asia-east1',
            'asia-northeast1',
            'asia-southeast1',
            'australia-southeast1',
            'europe-north1',
            'europe-west2',
            'us-east4',
        ]

        # Mapping of BigQuery multi-regional location to supported GCS bucket
        # locations.
        bq_gcs_loc_map = {
            "EU": [
                "EU",
                "europe-north1",
                "europe-west1",
                "europe-west2",
                "europe-west3",
                "europe-west4",
            ]
        }

        if bq_dataset_location == "US":
            # If your dataset is in the US multi-regional location, you can
            # load data from a Cloud Storage bucket in any regional or
            # multi-regional location.
            return True
        elif bq_dataset_location in bq_multi_regional_locations:
            # If your BigQuery dataset is in a multi-regional location,
            # the Cloud Storage bucket containing the data you're loading
            # must be in a regional or multi-regional bucket in the same
            # location.
            if gcs_bucket_location in bq_gcs_loc_map[bq_dataset_location]:
                return True
        elif bq_dataset_location in bq_regional_locations:
            # If your dataset is in a regional location, your Cloud Storage
            # bucket must be a regional bucket in the same location.
            if bq_dataset_location == gcs_bucket_location:
                return True
        else:
            # Handle any new additions to the BigQuery supported locations.
            pass
        return False

    @staticmethod
    def validate(hive_component, gcs_component, bq_component):
        """Method to validate the resources.

        Args:
            hive_component (:class:`HiveComponent`): Instance of
                HiveComponent to connect to Hive.
            gcs_component (:class:`GCSStorageComponent`): Instance of
                GCSStorageComponent to do GCS operations.
            bq_component (:class:`BigQueryComponent`): Instance of
                BigQueryComponent to do BigQuery operations.
        """

        if hive_component.check_database_exists(
                PropertiesReader.get('hive_database')):
            logger.debug("Hive database %s found",
                         PropertiesReader.get('hive_database'))
        else:
            logger.error("Hive database %s doesn't exist",
                         PropertiesReader.get('hive_database'))
            return False

        if hive_component.check_table_exists(
                PropertiesReader.get('hive_database'),
                PropertiesReader.get('hive_table_name')):
            logger.debug("Hive table %s found in database %s",
                         PropertiesReader.get('hive_table_name'),
                         PropertiesReader.get('hive_database'))
        else:
            logger.error("Hive table %s doesn't exist in database %s",
                         PropertiesReader.get('hive_table_name'),
                         PropertiesReader.get('hive_database'))
            return False

        if gcs_component.check_bucket_exists(
                PropertiesReader.get('gcs_bucket_name')):
            logger.debug("GCS Bucket %s found",
                         PropertiesReader.get('gcs_bucket_name'))
        else:
            logger.error("GCS bucket %s does not exist",
                         PropertiesReader.get('gcs_bucket_name'))
            return False

        if bq_component.check_dataset_exists(
                PropertiesReader.get('dataset_id')):
            logger.debug("BigQuery dataset %s found",
                         PropertiesReader.get('dataset_id'))
        else:
            logger.error("BigQuery dataset %s does not exist",
                         PropertiesReader.get('dataset_id'))
            return False

        bq_dataset_location = bq_component.get_dataset_location(
            PropertiesReader.get('dataset_id'))
        gcs_bucket_location = gcs_component.get_bucket_location(
            PropertiesReader.get('gcs_bucket_name'))
        # Checks whether the BigQuery dataset location and GCS bucket
        # location are compatible, since location constraints do not allow
        # loading data if locations are not compatible.
        if ResourceValidator.check_location_compatibility(
                bq_dataset_location, gcs_bucket_location):
            logger.debug(
                "Dataset location %s and GCS Bucket location %s matches",
                bq_dataset_location, gcs_bucket_location)
        else:
            logger.critical(
                "Dataset location %s and GCS Bucket location %s do not match",
                bq_dataset_location, gcs_bucket_location)
            logger.critical("Visit %s for more information", LOCATION_HELP_URL)
            return False

        return True
