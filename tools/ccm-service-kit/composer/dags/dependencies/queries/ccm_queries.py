# Copyright 2022 Google LLC All Rights Reserved.
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

from dependencies.scripts.variable_reader import getVariables

class QueriesCCM():

    """ 
    The purpose of this class is to define all the queries that the pipeline needs.
    You can define your queries here or you can use stored procedures in BQ, DBT or other service to create your model
    """

    # Use the getVariables.py script or load the json file into airflow and use airflow.model Variable.
    #If you want to use the getVariables.py you have to replace the provided json file path with you own
    # If you want to use the airflow variables, you have to call the variables like this: project_id = Variable.get("project_id")
    variables = getVariables()

    project_id = variables['project_id']
    dataset_staging = variables['ccm_staging_dataset']
    dataset_final = variables['ccm_final_dataset']
    gcp_row_billing = variables['gcp_billing_table']
    
    
    # Complete this file with the rest of the queries
    TRUNCATE_UNIFIED_LIST=f"""TRUNCATE TABLE {project_id}.{dataset_staging}.unified_list"""

    AZURE_INSERT= f"""INSERT INTO
            `{project_id}.{dataset_staging}.unified_list`
            SELECT
            2 AS cloud_provider_id,
            invoice_id AS invoice_id,
            billing_account_id AS billing_account_id,
            CAST(billing_period_start_date AS TIMESTAMP) AS billing_start_date,
            CAST(billing_period_end_date AS TIMESTAMP) AS billing_end_date,
            CAST(service_period_start_date AS TIMESTAMP) AS usage_start_date,
            CAST(service_period_end_date AS TIMESTAMP) AS usage_end_date,
            resource_location AS resource_location_id,
            meter_region AS region_id,
            invoice_section_id AS project_id,
            invoice_section_name AS project_name,
            meter_id AS service_id,
            product_id AS charge_id,
            product_name AS charge_description,
            product_name AS product_name,
            CAST(cost_in_usd AS FLOAT64) AS cost,
            billing_currency AS currency,
            charge_type AS charge_type,
            quantity AS usage_quantity,
            unit_of_measure AS usage_unit_of_measure,
            ifnull(service_category,
                'other'),
            ifnull(service_type,
                'other'),
            current_date AS loading_date
            FROM
            `{project_id}.{dataset_staging}.azure_billing` AS row_data
            LEFT OUTER JOIN (
                SELECT
                  *
                FROM
                    `{project_id}.{dataset_staging}.service_compare` 
                WHERE
                    cloud_provider = 'Azure') AS compare
            ON
            row_data.product_name = compare.product;"""



    AWS_INSERT = f""" INSERT INTO
            `{project_id}.{dataset_staging}.unified_list`
            SELECT
            3 AS cloud_provider_id,
            invoice_id AS invoice_id,
            CAST(payer_account_id AS STRING) AS billing_account_id,
            CAST(usage_start_date AS TIMESTAMP) AS billing_start_date,
            CAST(usage_end_date AS TIMESTAMP) AS billing_end_date,
            CAST(usage_start_date AS TIMESTAMP) AS usage_start_date,
            CAST(usage_end_date AS TIMESTAMP) AS usage_end_date,
            availability_zone AS resource_location_id,
            availability_zone AS region_id,
            null AS project_id,
            null AS project_name,
            resource_id AS service_id,
            null AS charge_id,
            item_description AS charge_description,
            product_name AS product_name,
            CAST(cost AS FLOAT64) AS cost,
            'USD' AS currency,
            usage_type AS charge_type,
            usage_quantity AS usage_quantity,
            null AS usage_unit_of_measure,
            ifnull(service_category,
                'other'),
            ifnull(service_type,
                'other'),
            current_date AS loading_date
            FROM
            `{project_id}.{dataset_staging}.aws_billing` AS row_data
            LEFT OUTER JOIN(
            SELECT
              *
            FROM
                `{project_id}.{dataset_staging}.service_compare`
            WHERE
                cloud_provider = 'AWS') AS compare
            ON
            row_data.product_name = compare.product;"""

    # This query is only for the incremental loads. If you want to load the historical data, you should remove the where condition:
    # WHERE DATE(_PARTITIONTIME) = DATE_SUB(current_date("America/Detroit"), INTERVAL 1 DAY)
    GCP_INSERT= f""" INSERT INTO
            `{project_id}.{dataset_staging}.unified_list`
            SELECT
            1 AS cloud_provider_id,
            NULL AS invoice_id,
            billing_account_id AS billing_account_id,
            NULL AS billing_start_date,
            NULL AS billing_end_date,
            usage_start_time AS usage_start_time,
            usage_end_time AS usage_end_time,
            location.location AS resource_location_id,
            location.region AS region_id,
            PROJECT.number AS project_id,
            PROJECT.name AS project_name,
            service.id AS service_id,
            sku.id AS charge_id,
            sku.description AS charge_description,
            service.description AS product_name,
            cost AS cost,
            currency AS currency,
            cost_type AS charge_type,
            usage.amount AS usage_quantity,
            usage.unit AS usage_unit_of_measure,
            ifnull(service_category,
                'other'),
            ifnull(service_type,
                'other'),
            current_date AS loading_date
            FROM
            `{project_id}.{dataset_staging}.gcp_billing` AS row_data
            LEFT JOIN (
            SELECT
                *
            FROM
                `{project_id}.{dataset_staging}.service_compare`
            WHERE
                cloud_provider = 'Google') AS compare
            ON
            row_data.service.description = compare.product
            WHERE 
                DATE(_PARTITIONTIME) = DATE_SUB(current_date("America/Detroit"), INTERVAL 1 DAY);"""

    REFRESH_PRODUCT = f"""MERGE
            {project_id}.{dataset_final}.product_name AS dim
            USING
            (
            SELECT
                DISTINCT(product_name) AS name
            FROM
                {project_id}.{dataset_staging}.unified_list) AS stage
            ON
            stage.name = dim.product_name
            WHEN NOT MATCHED
            THEN
            INSERT
            (product_name_key,
                product_name)
            VALUES
            (farm_fingerprint(stage.name),stage.name);"""

    REFRESH_RESOURCE_LOCATION = f"""MERGE
        {project_id}.{dataset_final}.resource_location AS dim
        USING
        (
        SELECT
            DISTINCT (resource_location_id) AS location,
            region_id AS region
        FROM
            {project_id}.{dataset_staging}.unified_list
        WHERE
            resource_location_id IS NOT NULL) AS stage
        ON
        stage.location = dim.resource_location
        WHEN NOT MATCHED
        THEN
        INSERT
        (resource_location_key,
            resource_location,
            resource_region)
        VALUES
        (farm_fingerprint(stage.location),stage.location,stage.region);"""

    REFESH_PROJECT = f"""MERGE
        {project_id}.{dataset_final}.project AS dim
        USING
        (
        SELECT
            DISTINCT (project_id),
            project_name
        FROM
            {project_id}.{dataset_staging}.unified_list
        WHERE
            project_id IS NOT NULL) AS stage
        ON
        stage.project_id = dim.project_id
        WHEN NOT MATCHED
        THEN
        INSERT
        (project_key,
            project_id,
            project_name)
        VALUES
        (farm_fingerprint(stage.project_id),stage.project_id,stage.project_name);"""

    REFRESH_CURRENCY = f"""MERGE
        {project_id}.{dataset_final}.currency AS dim
        USING
        (
        SELECT
            DISTINCT currency AS currency
        FROM
            {project_id}.{dataset_staging}.unified_list) AS stage
        ON
        stage.currency = dim.currency
        WHEN NOT MATCHED
        THEN
        INSERT
        (currency_key,
            currency)
        VALUES
        (farm_fingerprint(stage.currency),stage.currency);"""

    REFRESH_CHARGE = f"""MERGE
        {project_id}.{dataset_final}.charge AS dim
        USING
        (
        SELECT
            DISTINCT (charge_id) AS id,
            charge_description AS description
        FROM
            {project_id}.{dataset_staging}.unified_list
        WHERE
            charge_id IS NOT NULL) AS stage
        ON
        stage.id = dim.charge_id
        AND stage.description = dim.charge_description
        WHEN NOT MATCHED
        THEN
        INSERT
        (charge_key,
            charge_id,
            charge_description)
        VALUES
        (farm_fingerprint(stage.id),stage.id,stage.description);"""

    REFRESH_BILLING_ACCOUNT = f"""MERGE
        {project_id}.{dataset_final}.billing_account AS dim
        USING
        (
        SELECT
            DISTINCT billing_account_id AS billing_account
        FROM
            {project_id}.{dataset_staging}.unified_list
        WHERE
            billing_account_id IS NOT NULL) AS stage
        ON
        stage.billing_account = dim.billing_account_id
        WHEN NOT MATCHED
        THEN
        INSERT
        (billing_account_key,
            billing_account_id)
        VALUES
        (farm_fingerprint(stage.billing_account),stage.billing_account);"""

    REFRESH_CHARGE_TYPE = f"""MERGE
        {project_id}.{dataset_final}.charge_type AS dim
        USING
        (
        SELECT
            DISTINCT charge_type AS type
        FROM
            {project_id}.{dataset_staging}.unified_list
        WHERE
            charge_type IS NOT NULL) AS stage
        ON
        stage.type = dim.charge_type
        WHEN NOT MATCHED
        THEN
        INSERT
        (charge_type_key,
            charge_type)
        VALUES
        (farm_fingerprint(stage.type),stage.type);"""

    REFRESH_SERVICE = f"""MERGE
        {project_id}.{dataset_final}.service AS dim
        USING
        (
        SELECT
            DISTINCT service_id AS id
        FROM
            {project_id}.{dataset_staging}.unified_list
        WHERE
            service_id IS NOT NULL) AS stage
        ON
        stage.id = dim.service_id
        WHEN NOT MATCHED
        THEN
        INSERT
        (service_key,
            service_id)
        VALUES
        (farm_fingerprint(stage.id),stage.id);"""

    REFRESH_SERVICE_TYPE = f"""MERGE
        {project_id}.{dataset_final}.service_type AS dim
        USING
        (
        SELECT
            DISTINCT service_category AS category,
            service_type AS type
        FROM
            {project_id}.{dataset_staging}.unified_list
        WHERE
            service_category IS NOT NULL
            AND service_type IS NOT NULL) AS stage
        ON
        stage.category = dim.service_category
        AND stage.type = dim.service_type
        WHEN NOT MATCHED
        THEN
        INSERT
        (service_type_key,
            service_category,
            service_type)
        VALUES
        (farm_fingerprint(stage.category||stage.type),stage.category,stage.type);"""


    REFRESH_UNIFIED_CLOUD_BILLING = f"""INSERT INTO
        {project_id}.{dataset_final}.unified_cloud_billing (row_key,
            project_key,
            service_type_key,
            resource_location_key,
            product_name_key,
            usage_unit_of_measure_key,
            cloud_provider_key,
            charge_type_key,
            billing_account_key,
            service_key,
            charge_key,
            currency_key,
            billing_end_date,
            billing_start_date,
            usage_start_date,
            usage_end_date,
            usage_quantity,
            cost,
            upload_date) (
        SELECT
            (
            SELECT
            COUNT(*)
            FROM
            {project_id}.{dataset_final}.unified_cloud_billing ) + ROW_NUMBER() OVER() AS row_key,
            IFNULL(project_key,
            1),
            IFNULL(service_type_key,
            1),
            IFNULL(resource_location_key,
            1),
            IFNULL(product_name_key,
            1),
            IFNULL(usage_unit_of_measure_key,
            1),
            cloud_provider_id AS cloud_provider_key,
            IFNULL(charge_type_key,
            1),
            IFNULL(billing_account_key,
            1),
            IFNULL(service_key,
            1),
            IFNULL(charge_key,
            1),
            IFNULL(currency_key,
            1),
            billing_end_date,
            billing_start_date,
            usage_start_time AS usage_start_date,
            usage_end_time AS usage_end_date,
            usage_quantity,
            cost,
            loading_date
        FROM
            {project_id}.{dataset_staging}.unified_list AS list
        LEFT OUTER JOIN
            {project_id}.{dataset_final}.project AS project
        ON
            list.project_id = project.project_id
            AND list.project_name = project.project_name
        LEFT OUTER JOIN
            {project_id}.{dataset_final}.resource_location AS resource
        ON
            list.resource_location_id = resource.resource_location
            AND list.region_id = resource.resource_region
        LEFT OUTER JOIN
            {project_id}.{dataset_final}.service_type AS service_type
        ON
            list.service_category = service_type.service_category
            AND list.service_type = service_type.service_type
        LEFT OUTER JOIN
            {project_id}.{dataset_final}.product_name AS dim
        ON
            list.product_name = dim.product_name
        LEFT OUTER JOIN
            {project_id}.{dataset_final}.usage_unit_of_measure AS unit
        ON
            list.usage_unit_of_measure = unit.usage_unit_of_measure
        LEFT OUTER JOIN
            {project_id}.{dataset_final}.charge_type AS charge_type
        ON
            list.charge_type = charge_type.charge_type
        LEFT OUTER JOIN
            {project_id}.{dataset_final}.billing_account AS billing_account
        ON
            list.billing_account_id = billing_account.billing_account_id
        LEFT OUTER JOIN
            {project_id}.{dataset_final}.service AS service
        ON
            list.service_id = service.service_id
        LEFT OUTER JOIN
            {project_id}.{dataset_final}.charge AS charge
        ON
            list.charge_id = charge.charge_id
            AND list.charge_description = charge.charge_description
        LEFT OUTER JOIN
            {project_id}.{dataset_final}.currency AS currency
        ON
            list.currency = currency.currency);"""    