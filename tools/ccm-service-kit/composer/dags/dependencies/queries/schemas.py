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

class Schema():
    
    """
    The purpose of this class is to define the schema for the tables that will use a BQ Load job.
    Replace here with your own billing schema.
    """

    AZURE_BILLING = [
                        {
                            "mode": "NULLABLE",
                            "name": "invoice_id",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "previous_invoice_id",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "billing_account_id",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "billing_account_name",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "billing_profile_id",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "billing_profile_name",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "invoice_section_id",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "invoice_section_name",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "reseller_name",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "reseller_mpn_id",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "cost_center",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "billing_period_end_date",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "billing_period_start_date",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "service_period_end_date",
                            "type": "DATE"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "service_period_start_date",
                            "type": "DATE"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "date",
                            "type": "DATE"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "service_family",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "product_order_id",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "product_order_name",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "consumed_service",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "meter_id",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "meter_name",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "meter_category",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "meter_sub_category",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "meter_region",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "product_id",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "product_name",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "subscription_id",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "subscription_name",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "publisher_type",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "publisher_id",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "publisher_name",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "resource_group_name",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "resource_id",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "resource_location",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "location",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "effective_price",
                            "type": "FLOAT"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "quantity",
                            "type": "FLOAT"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "unit_of_measure",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "charge_type",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "billing_currency",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "pricing_currency",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "cost_in_billing_currency",
                            "type": "FLOAT"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "cost_in_pricing_currency",
                            "type": "FLOAT"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "cost_in_usd",
                            "type": "FLOAT"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "payg_cost_in_billing_currency",
                            "type": "FLOAT"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "payg_cost_in_usd",
                            "type": "FLOAT"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "exchange_rate_pricing_to_billing",
                            "type": "INTEGER"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "exchange_rate_date",
                            "type": "DATE"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "is_azure_credit_eligible",
                            "type": "BOOLEAN"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "service_info_1",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "service_info_2",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "additional_info",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "tags",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "pay_g_price",
                            "type": "FLOAT"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "frequency",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "term",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "reservation_id",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "reservation_name",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "pricing_model",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "unit_price",
                            "type": "FLOAT"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "cost_allocation_rule_name",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "benefit_id",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "benefit_name",
                            "type": "STRING"
                        },
                        {
                            "mode": "NULLABLE",
                            "name": "provider",
                            "type": "STRING"
                        }
                    ]

    AWS_BILLING = [
                    {
                        "mode": "NULLABLE",
                        "name": "invoice_id",
                        "type": "STRING"
                    },
                    {
                        "mode": "NULLABLE",
                        "name": "payer_account_id",
                        "type": "INTEGER"
                    },
                    {
                        "mode": "NULLABLE",
                        "name": "linked_account_id",
                        "type": "INTEGER"
                    },
                    {
                        "mode": "NULLABLE",
                        "name": "record_type",
                        "type": "STRING"
                    },
                    {
                        "mode": "NULLABLE",
                        "name": "record_id",
                        "type": "FLOAT"
                    },
                    {
                        "mode": "NULLABLE",
                        "name": "product_name",
                        "type": "STRING"
                    },
                    {
                        "mode": "NULLABLE",
                        "name": "rate_id",
                        "type": "INTEGER"
                    },
                    {
                        "mode": "NULLABLE",
                        "name": "subscription_id",
                        "type": "INTEGER"
                    },
                    {
                        "mode": "NULLABLE",
                        "name": "pricing_plan_id",
                        "type": "INTEGER"
                    },
                    {
                        "mode": "NULLABLE",
                        "name": "usage_type",
                        "type": "STRING"
                    },
                    {
                        "mode": "NULLABLE",
                        "name": "operation",
                        "type": "STRING"
                    },
                    {
                        "mode": "NULLABLE",
                        "name": "availability_zone",
                        "type": "STRING"
                    },
                    {
                        "mode": "NULLABLE",
                        "name": "reserved_instance",
                        "type": "BOOLEAN"
                    },
                    {
                        "mode": "NULLABLE",
                        "name": "item_description",
                        "type": "STRING"
                    },
                    {
                        "mode": "NULLABLE",
                        "name": "usage_start_date",
                        "type": "TIMESTAMP"
                    },
                    {
                        "mode": "NULLABLE",
                        "name": "usage_end_date",
                        "type": "TIMESTAMP"
                    },
                    {
                        "mode": "NULLABLE",
                        "name": "usage_quantity",
                        "type": "FLOAT"
                    },
                    {
                        "mode": "NULLABLE",
                        "name": "rate",
                        "type": "FLOAT"
                    },
                    {
                        "mode": "NULLABLE",
                        "name": "cost",
                        "type": "FLOAT"
                    },
                    {
                        "mode": "NULLABLE",
                        "name": "resource_id",
                        "type": "STRING"
                    }
                ]
