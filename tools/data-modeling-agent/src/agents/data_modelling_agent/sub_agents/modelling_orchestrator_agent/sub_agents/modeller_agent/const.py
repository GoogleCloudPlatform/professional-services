# Copyright 2026 Google LLC
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

import os

config = {
  "gcp_project_id": os.getenv("GOOGLE_CLOUD_PROJECT", "your-gcp-project-id"),
  "gcp_location": "us-central1",
  "gemini_model_name": "gemini-2.0-flash",
  "domain_context": "Retail E-commerce Analytics",
  "design_mode_params": {
    "kpis_config_file": "kpis.json",
    "existing_model_schema_file": "existing_schema.json"
  },
  "generation_config": {
    "temperature": 0.7,
    "top_p": 0.9,
    "top_k": 40,
    "max_output_tokens": 8192
  },
  "modeling_guidelines": {
    "dimension_table_prefix": "Dim",
    "fact_table_prefix": "Fact",
    "date_dimension_name": "Dim_Date",
    "raw_table_prefix": "raw",
    "staging_table_prefix": "stg",
    "bronze_table_prefix": "bronze",
    "gold_aggregate_table_prefix": "agg",
    "gold_mart_table_prefix": "mrt"
  },
  "output_personas": {
    "data_modeler": [
      "Logical Model & Physical Suggestions",
      "Mermaid ER Diagram Code",
      "Semantic Model Skeleton",
      "Refinement Questions (with Rationale)"
    ],
    "data_engineer": [
      "Logical Model & Physical Suggestions",
      "SQL DDL for Core Tables (Dims & Facts)",
      "BigQuery Detailed Metadata (JSON)",
      "Dataform SQLX (Core Tables)",
      "Conceptual Data Product Flow"
    ],
    "all": [
      "Logical Model & Physical Suggestions",
      # "Mermaid ER Diagram Code",
      "SQL DDL for Core Tables (Dims & Facts)",
      "BigQuery Detailed Metadata (JSON)"
    #   "Dataform SQLX (Core Tables)",
    #   "Conceptual Data Product Flow",
    #   "Semantic Model Skeleton",
    #   "Refinement Questions (with Rationale)",
    #   "Executive Summary & Medallion Flow"
    ]
  },
  "active_persona": "All"
}

DDL_TASK = "SQL DDL for Core Tables (Dims & Facts)"
BQ_METADATA_TASK = "BigQuery Detailed Metadata (JSON)"
BQ_LOGICAL_MODEL_TASK = "Logical Model & Physical Suggestions"



output_fmt = """
{
  "Logical Model & Physical Suggestions":"",
  "Mermaid ER Diagram Code":"",
  "SQL DDL for Core Tables (Dims & Facts)":"",
  "BigQuery Detailed Metadata (JSON)":"",
  "Dataform SQLX (Core Tables)":"",
  "Conceptual Data Product Flow":"",
  "Semantic Model Skeleton":"",
  "Refinement Questions (with Rationale)":"",
  "Executive Summary & Medallion Flow":""
}
"""
BQ_METADATA_TASK_SCHEMA = """
{
  "model_name":"string",
  "description":"string
  "tables":[
    {
      "table_name":"string",
      "table_type":"string",
      "description":"string",
      "grain":"string",
      "bigquery_optimizations":{
        "partitioning":{
          "field":"string",
          "type":"string"
        },
        "clustering":[
          "string"
        ]
      },
      "columns":[
        {
          "name":"string",
          "data_type":"string",
          "description":"string",
          "is_primary_key":true,
          "is_foreign_key":true,
          "references":"string"
        }
      ]
    }
  ],
  "kpis":[
    {
      "kpi_name":"string",
      "description":"string",
      "calculation_method":"string",
      "source_tables":[
        "string"
      ],
      "dimensions_for_analysis":[
        "string"
      ]
    }
  ],
  "relationships":[
    {
      "from_table":"string",
      "from_column":"string",
      "to_table":"string",
      "to_column":"string",
      "relationship_type":"string"
    }
  ] 
}
"""

BQ_METADATA_TASK_EXAMPLE="""{
  "model_name": "e_commerce_star_schema",
  "description": "Dimensional data model for e-commerce analytics, optimized for BigQuery, tracking sales, customer acquisition, and lifetime value.",
  "tables": [
    {
      "table_name": "Fact_Sales",
      "table_type": "FACT",
      "description": "Primary fact table, recording every individual item sold within an order. Most granular level for sales analysis.",
      "grain": "One row per order item.",
      "bigquery_optimizations": {
        "partitioning": {
          "field": "order_timestamp",
          "type": "DAY"
        },
        "clustering": [
          "customer_key",
          "product_key",
          "order_id"
        ]
      },
      "columns": [
        {
          "name": "order_item_id",
          "data_type": "STRING",
          "description": "Unique identifier for the order item.",
          "is_primary_key": true
        },
        {
          "name": "order_id",
          "data_type": "STRING",
          "description": "Unique identifier for the overall order."
        },
        {
          "name": "customer_key",
          "data_type": "INT64",
          "description": "Foreign Key to Dim_Customer.",
          "is_foreign_key": true,
          "references": "Dim_Customer.customer_key"
        },
        {
          "name": "product_key",
          "data_type": "INT64",
          "description": "Foreign Key to Dim_Product.",
          "is_foreign_key": true,
          "references": "Dim_Product.product_key"
        },
        {
          "name": "order_date_key",
          "data_type": "INT64",
          "description": "Foreign Key to Dim_Date (representing the date of the order).",
          "is_foreign_key": true,
          "references": "Dim_Date.time_key"
        },
        {
          "name": "shipping_address_key",
          "data_type": "INT64",
          "description": "Foreign Key to Dim_Shipping_Address (the address used for shipping at the time of the order).",
          "is_foreign_key": true,
          "references": "Dim_Shipping_Address.shipping_address_key"
        },
        {
          "name": "quantity",
          "data_type": "INT64",
          "description": "Number of units of the product sold in this item."
        },
        {
          "name": "unit_price_at_sale",
          "data_type": "NUMERIC",
          "description": "Price per unit at the time of sale before any item-specific discounts."
        },
        {
          "name": "item_sales_amount",
          "data_type": "NUMERIC",
          "description": "The total revenue for this specific item, calculated as (quantity * unit_price_at_sale) - discount_amount."
        },
        {
          "name": "discount_amount",
          "data_type": "NUMERIC",
          "description": "Discount applied specifically to this item."
        },
        {
          "name": "order_status",
          "data_type": "STRING",
          "description": "Status of the overall order (e.g., 'Completed', 'Pending', 'Cancelled')."
        },
        {
          "name": "payment_method",
          "data_type": "STRING",
          "description": "Method used for payment (e.g., 'Credit Card', 'PayPal')."
        },
        {
          "name": "shipping_cost",
          "data_type": "NUMERIC",
          "description": "Shipping cost associated with this item (or allocated portion of total order shipping)."
        },
        {
          "name": "order_timestamp",
          "data_type": "TIMESTAMP",
          "description": "Full timestamp of the order, critical for time-based partitioning."
        }
      ]
    },
    {
      "table_name": "Fact_Customer_Acquisition_LTV",
      "table_type": "FACT",
      "description": "Stores metrics directly related to customer acquisition and lifetime value, often calculated or attributed at the customer level over specific periods.",
      "grain": "One row per customer per acquisition event or LTV calculation snapshot.",
      "bigquery_optimizations": {
        "clustering": [
          "customer_key"
        ]
      },
      "columns": [
        {
          "name": "customer_acquisition_key",
          "data_type": "INT64",
          "description": "Primary Key (Surrogate Key).",
          "is_primary_key": true
        },
        {
          "name": "customer_key",
          "data_type": "INT64",
          "description": "Foreign Key to Dim_Customer.",
          "is_foreign_key": true,
          "references": "Dim_Customer.customer_key"
        },
        {
          "name": "acquisition_date_key",
          "data_type": "INT64",
          "description": "Foreign Key to Dim_Date (the date the customer was acquired).",
          "is_foreign_key": true,
          "references": "Dim_Date.time_key"
        },
        {
          "name": "acquisition_channel",
          "data_type": "STRING",
          "description": "The marketing channel through which the customer was acquired (e.g., 'Organic Search', 'Paid Social')."
        },
        {
          "name": "customer_acquisition_cost",
          "data_type": "NUMERIC",
          "description": "The cost incurred to acquire this specific customer."
        },
        {
          "name": "lifetime_value_to_date",
          "data_type": "NUMERIC",
          "description": "The calculated Customer Lifetime Value up to a given calculation date. This can be a running sum or a snapshot."
        },
        {
          "name": "ltv_calculation_date_key",
          "data_type": "INT64",
          "description": "Foreign Key to Dim_Date (the date when the LTV was calculated or last updated).",
          "is_foreign_key": true,
          "references": "Dim_Date.time_key"
        }
      ]
    },
    {
      "table_name": "Dim_Customer",
      "table_type": "DIMENSION",
      "description": "Stores detailed information about each customer.",
      "columns": [
        {
          "name": "customer_key",
          "data_type": "INT64",
          "description": "Primary Key (Surrogate Key).",
          "is_primary_key": true
        },
        {
          "name": "customer_id",
          "data_type": "STRING",
          "description": "Unique identifier from the source system."
        },
        {
          "name": "first_name",
          "data_type": "STRING",
          "description": "Customer's first name."
        },
        {
          "name": "last_name",
          "data_type": "STRING",
          "description": "Customer's last name."
        },
        {
          "name": "email",
          "data_type": "STRING",
          "description": "Customer's email address."
        },
        {
          "name": "phone_number",
          "data_type": "STRING",
          "description": "Customer's phone number."
        },
        {
          "name": "registration_date",
          "data_type": "DATE",
          "description": "Date of customer registration."
        },
        {
          "name": "last_login_date",
          "data_type": "DATE",
          "description": "Date of customer's last login."
        },
        {
          "name": "loyalty_status",
          "data_type": "STRING",
          "description": "Customer's loyalty program status."
        },
        {
          "name": "birth_date",
          "data_type": "DATE",
          "description": "Customer's birth date."
        },
        {
          "name": "gender",
          "data_type": "STRING",
          "description": "Customer's gender."
        },
        {
          "name": "city",
          "data_type": "STRING",
          "description": "Customer's city."
        },
        {
          "name": "state",
          "data_type": "STRING",
          "description": "Customer's state/province."
        },
        {
          "name": "country",
          "data_type": "STRING",
          "description": "Customer's country."
        }
      ]
    },
    {
      "table_name": "Dim_Product",
      "table_type": "DIMENSION",
      "description": "Contains comprehensive attributes for each product.",
      "columns": [
        {
          "name": "product_key",
          "data_type": "INT64",
          "description": "Primary Key (Surrogate Key).",
          "is_primary_key": true
        },
        {
          "name": "product_id",
          "data_type": "STRING",
          "description": "Unique identifier from the source system."
        },
        {
          "name": "product_name",
          "data_type": "STRING",
          "description": "Name of the product."
        },
        {
          "name": "sku",
          "data_type": "STRING",
          "description": "Stock Keeping Unit."
        },
        {
          "name": "category",
          "data_type": "STRING",
          "description": "Primary product category."
        },
        {
          "name": "subcategory",
          "data_type": "STRING",
          "description": "Secondary product category."
        },
        {
          "name": "brand",
          "data_type": "STRING",
          "description": "Product brand."
        },
        {
          "name": "color",
          "data_type": "STRING",
          "description": "Product color."
        },
        {
          "name": "size",
          "data_type": "STRING",
          "description": "Product size."
        },
        {
          "name": "current_list_price",
          "data_type": "NUMERIC",
          "description": "The current standard list price of the product."
        },
        {
          "name": "product_status",
          "data_type": "STRING",
          "description": "Product status (e.g., 'Active', 'Discontinued')."
        }
      ]
    },
    {
      "table_name": "Dim_Date",
      "table_type": "DIMENSION",
      "description": "A conformed dimension providing comprehensive time-based attributes for analytical purposes.",
      "columns": [
        {
          "name": "time_key",
          "data_type": "INT64",
          "description": "Primary Key (Surrogate Key), typically in YYYYMMDD format.",
          "is_primary_key": true
        },
        {
          "name": "full_date",
          "data_type": "DATE",
          "description": "The actual date value."
        },
        {
          "name": "day_of_week",
          "data_type": "INT64",
          "description": "Day of the week (1=Sunday, 7=Saturday)."
        },
        {
          "name": "day_name",
          "data_type": "STRING",
          "description": "Full name of the day (e.g., 'Monday')."
        },
        {
          "name": "day_of_month",
          "data_type": "INT64",
          "description": "Day of the month (1-31)."
        },
        {
          "name": "day_of_year",
          "data_type": "INT64",
          "description": "Day of the year (1-366)."
        },
        {
          "name": "week_of_year",
          "data_type": "INT64",
          "description": "Week number of the year."
        },
        {
          "name": "month_number",
          "data_type": "INT64",
          "description": "Month number (1-12)."
        },
        {
          "name": "month_name",
          "data_type": "STRING",
          "description": "Full name of the month (e.g., 'January')."
        },
        {
          "name": "quarter",
          "data_type": "INT64",
          "description": "Quarter of the year (e.g., 1 for Q1)."
        },
        {
          "name": "year",
          "data_type": "INT64",
          "description": "Year."
        },
        {
          "name": "is_weekend",
          "data_type": "BOOLEAN",
          "description": "True if the date is a weekend, false otherwise."
        },
        {
          "name": "is_holiday",
          "data_type": "BOOLEAN",
          "description": "True if the date is a holiday, false otherwise."
        }
      ]
    },
    {
      "table_name": "Dim_Shipping_Address",
      "table_type": "DIMENSION",
      "description": "Stores details of shipping addresses. Assumed to capture the state at the time of transaction for the linked address.",
      "columns": [
        {
          "name": "shipping_address_key",
          "data_type": "INT64",
          "description": "Primary Key (Surrogate Key).",
          "is_primary_key": true
        },
        {
          "name": "address_id",
          "data_type": "STRING",
          "description": "Unique identifier from the source system (if available)."
        },
        {
          "name": "address_line1",
          "data_type": "STRING",
          "description": "First line of the address."
        },
        {
          "name": "address_line2",
          "data_type": "STRING",
          "description": "Second line of the address (optional)."
        },
        {
          "name": "city",
          "data_type": "STRING",
          "description": "City of the shipping address."
        },
        {
          "name": "state",
          "data_type": "STRING",
          "description": "State/province of the shipping address."
        },
        {
          "name": "zip_code",
          "data_type": "STRING",
          "description": "Shipping ZIP code."
        },
        {
          "name": "country",
          "data_type": "STRING",
          "description": "Country of the shipping address."
        },
        {
          "name": "latitude",
          "data_type": "NUMERIC",
          "description": "Optional: Latitude for geographic analysis."
        },
        {
          "name": "longitude",
          "data_type": "NUMERIC",
          "description": "Optional: Longitude for geographic analysis."
        }
      ]
    }
  ],
  "kpis": [
    {
      "kpi_name": "Total Sales Amount",
      "description": "The total revenue from product sales.",
      "calculation_method": "SUM(Fact_Sales.item_sales_amount)",
      "source_tables": ["Fact_Sales"],
      "dimensions_for_analysis": ["Dim_Date", "Dim_Product", "Dim_Customer", "Dim_Shipping_Address"]
    },
    {
      "kpi_name": "Number of Orders",
      "description": "The total count of unique orders.",
      "calculation_method": "COUNT(DISTINCT Fact_Sales.order_id)",
      "source_tables": ["Fact_Sales"],
      "dimensions_for_analysis": ["Dim_Date", "Dim_Customer", "Dim_Shipping_Address"]
    },
    {
      "kpi_name": "Average Order Value",
      "description": "The average revenue generated per order.",
      "calculation_method": "SUM(Fact_Sales.item_sales_amount) / COUNT(DISTINCT Fact_Sales.order_id)",
      "source_tables": ["Fact_Sales"],
      "dimensions_for_analysis": ["Dim_Date", "Dim_Customer", "Dim_Shipping_Address"]
    },
    {
      "kpi_name": "Customer Acquisition Cost (CAC)",
      "description": "The cost incurred to acquire a specific customer.",
      "calculation_method": "Fact_Customer_Acquisition_LTV.customer_acquisition_cost",
      "source_tables": ["Fact_Customer_Acquisition_LTV", "Dim_Customer"],
      "dimensions_for_analysis": ["Dim_Date", "Dim_Customer"]
    },
    {
      "kpi_name": "Customer Lifetime Value (LTV)",
      "description": "The calculated Customer Lifetime Value up to a given calculation date, representing the total revenue a business can expect from a customer over their lifetime.",
      "calculation_method": "Fact_Customer_Acquisition_LTV.lifetime_value_to_date",
      "source_tables": ["Fact_Customer_Acquisition_LTV", "Dim_Customer"],
      "dimensions_for_analysis": ["Dim_Date", "Dim_Customer"]
    }
  ],
  "relationships": [
    {
      "from_table": "Fact_Sales",
      "from_column": "customer_key",
      "to_table": "Dim_Customer",
      "to_column": "customer_key",
      "relationship_type": "many-to-one"
    },
    {
      "from_table": "Fact_Sales",
      "from_column": "product_key",
      "to_table": "Dim_Product",
      "to_column": "product_key",
      "relationship_type": "many-to-one"
    },
    {
      "from_table": "Fact_Sales",
      "from_column": "order_date_key",
      "to_table": "Dim_Date",
      "to_column": "time_key",
      "relationship_type": "many-to-one"
    },
    {
      "from_table": "Fact_Sales",
      "from_column": "shipping_address_key",
      "to_table": "Dim_Shipping_Address",
      "to_column": "shipping_address_key",
      "relationship_type": "many-to-one"
    },
    {
      "from_table": "Fact_Customer_Acquisition_LTV",
      "from_column": "customer_key",
      "to_table": "Dim_Customer",
      "to_column": "customer_key",
      "relationship_type": "many-to-one"
    },
    {
      "from_table": "Fact_Customer_Acquisition_LTV",
      "from_column": "acquisition_date_key",
      "to_table": "Dim_Date",
      "to_column": "time_key",
      "relationship_type": "many-to-one"
    },
    {
      "from_table": "Fact_Customer_Acquisition_LTV",
      "from_column": "ltv_calculation_date_key",
      "to_table": "Dim_Date",
      "to_column": "time_key",
      "relationship_type": "many-to-one"
    }
  ]
}
"""




BQ_DDL_TASK_EXAMPLE = """
```sql
-- DDL for BigQuery Dimensional Data Model

-- Dimension Table: Dim_Date
CREATE TABLE `project_id.dataset_id.Dim_Date` (
    time_key INT64 NOT NULL OPTIONS(description="Primary Key (Surrogate Key), typically in YYYYMMDD format."),
    full_date DATE NOT NULL OPTIONS(description="The actual date value."),
    day_of_week INT64 OPTIONS(description="Day of the week (1=Sunday, 7=Saturday)."),
    day_name STRING OPTIONS(description="Full name of the day (e.g., 'Monday')."),
    day_of_month INT64 OPTIONS(description="Day of the month (1-31)."),
    day_of_year INT64 OPTIONS(description="Day of the year (1-366)."),
    week_of_year INT64 OPTIONS(description="Week number of the year."),
    month_number INT64 OPTIONS(description="Month number (1-12)."),
    month_name STRING OPTIONS(description="Full name of the month (e.g., 'January')."),
    quarter INT64 OPTIONS(description="Quarter of the year (1-4)."),
    year INT64 OPTIONS(description="Year."),
    is_weekend BOOLEAN OPTIONS(description="True if the date is a weekend."),
    is_holiday BOOLEAN OPTIONS(description="True if the date is a holiday.")
)
OPTIONS(
    description="A conformed dimension providing comprehensive time-based attributes for analytical purposes."
);

-- Dimension Table: Dim_Customer
CREATE TABLE `project_id.dataset_id.Dim_Customer` (
    customer_key INT64 NOT NULL OPTIONS(description="Primary Key (Surrogate Key)."),
    customer_id STRING OPTIONS(description="Unique identifier from the source system."),
    first_name STRING OPTIONS(description="Customer's first name."),
    last_name STRING OPTIONS(description="Customer's last name."),
    email STRING OPTIONS(description="Customer's email address."),
    phone_number STRING OPTIONS(description="Customer's phone number."),
    registration_date DATE OPTIONS(description="Date the customer registered."),
    last_login_date DATE OPTIONS(description="Date of the customer's last login."),
    loyalty_status STRING OPTIONS(description="Customer's loyalty program status (e.g., 'Gold', 'Silver')."),
    birth_date DATE OPTIONS(description="Customer's birth date."),
    gender STRING OPTIONS(description="Customer's gender."),
    city STRING OPTIONS(description="Customer's city."),
    state STRING OPTIONS(description="Customer's state."),
    country STRING OPTIONS(description="Customer's country.")
)
OPTIONS(
    description="Stores detailed information about each customer."
);

-- Dimension Table: Dim_Product
CREATE TABLE `project_id.dataset_id.Dim_Product` (
    product_key INT64 NOT NULL OPTIONS(description="Primary Key (Surrogate Key)."),
    product_id STRING OPTIONS(description="Unique identifier from the source system."),
    product_name STRING OPTIONS(description="Name of the product."),
    sku STRING OPTIONS(description="Stock Keeping Unit."),
    category STRING OPTIONS(description="Primary product category."),
    subcategory STRING OPTIONS(description="Secondary product category."),
    brand STRING OPTIONS(description="Product brand."),
    color STRING OPTIONS(description="Product color."),
    size STRING OPTIONS(description="Product size."),
    current_list_price NUMERIC OPTIONS(description="The current standard list price of the product."),
    product_status STRING OPTIONS(description="Status of the product (e.g., 'Active', 'Discontinued').")
)
OPTIONS(
    description="Contains comprehensive attributes for each product."
);

-- Dimension Table: Dim_Shipping_Address
CREATE TABLE `project_id.dataset_id.Dim_Shipping_Address` (
    shipping_address_key INT64 NOT NULL OPTIONS(description="Primary Key (Surrogate Key)."),
    address_id STRING OPTIONS(description="Unique identifier from the source system (if available)."),
    address_line1 STRING OPTIONS(description="First line of the shipping address."),
    address_line2 STRING OPTIONS(description="Second line of the shipping address (optional)."),
    city STRING OPTIONS(description="Shipping address city."),
    state STRING OPTIONS(description="Shipping address state."),
    zip_code STRING OPTIONS(description="Customer's shipping ZIP code."),
    country STRING OPTIONS(description="Shipping address country."),
    latitude NUMERIC OPTIONS(description="Optional, for geographic analysis (latitude coordinate)."),
    longitude NUMERIC OPTIONS(description="Optional, for geographic analysis (longitude coordinate).")
)
OPTIONS(
    description="Stores details of shipping addresses."
);

-- Fact Table: Fact_Sales
CREATE TABLE `project_id.dataset_id.Fact_Sales` (
    order_item_id STRING NOT NULL OPTIONS(description="Unique identifier for the order item."),
    order_id STRING NOT NULL OPTIONS(description="Unique identifier for the overall order."),
    customer_key INT64 NOT NULL OPTIONS(description="Foreign Key to Dim_customer."),
    product_key INT64 NOT NULL OPTIONS(description="Foreign Key to Dim_product."),
    order_date_key INT64 NOT NULL OPTIONS(description="Foreign Key to Dim_Date (representing the date of the order)."),
    shipping_address_key INT64 NOT NULL OPTIONS(description="Foreign Key to Dim_shipping_address (the address used for shipping at the time of the order)."),
    quantity INT64 NOT NULL OPTIONS(description="Number of units of the product sold in this item."),
    unit_price_at_sale NUMERIC NOT NULL OPTIONS(description="Price per unit at the time of sale before any item-specific discounts."),
    item_sales_amount NUMERIC NOT NULL OPTIONS(description="The total revenue for this specific item, calculated as (quantity * unit_price_at_sale) - discount_amount. Represents Total Sales Amount at the item level."),
    discount_amount NUMERIC OPTIONS(description="Discount applied specifically to this item."),
    order_status STRING OPTIONS(description="Status of the overall order (e.g., 'Completed', 'Pending', 'Cancelled')."),
    payment_method STRING OPTIONS(description="Method used for payment (e.g., 'Credit Card', 'PayPal')."),
    shipping_cost NUMERIC OPTIONS(description="Shipping cost associated with this item (or allocated portion of total order shipping)."),
    order_timestamp TIMESTAMP NOT NULL OPTIONS(description="Full timestamp of the order, critical for time-based partitioning.")
)
PARTITION BY DATE(order_timestamp)
CLUSTER BY customer_key, product_key, order_id
OPTIONS(
    description="This is the primary fact table, recording every individual item sold within an order. It's the most granular level for sales analysis."
);

-- Fact Table: Fact_Customer_Acquisition_LTV
CREATE TABLE `project_id.dataset_id.Fact_Customer_Acquisition_LTV` (
    customer_acquisition_key INT64 NOT NULL OPTIONS(description="Primary Key (Surrogate Key)."),
    customer_key INT64 NOT NULL OPTIONS(description="Foreign Key to Dim_customer."),
    acquisition_date_key INT64 NOT NULL OPTIONS(description="Foreign Key to Dim_Date (the date the customer was acquired)."),
    acquisition_channel STRING OPTIONS(description="The marketing channel through which the customer was acquired (e.g., 'Organic Search', 'Paid Social')."),
    customer_acquisition_cost NUMERIC OPTIONS(description="The cost incurred to acquire this specific customer."),
    lifetime_value_to_date NUMERIC OPTIONS(description="The calculated Customer Lifetime Value up to a given calculation date."),
    ltv_calculation_date_key INT64 NOT NULL OPTIONS(description="Foreign Key to Dim_Date (the date when the LTV was calculated or last updated).")
)
CLUSTER BY customer_key
OPTIONS(
    description="This fact table stores metrics directly related to customer acquisition and lifetime value, which are often calculated or attributed at the customer level over specific periods."
);
```
"""

BQ_LOGICAL_MODEL_TASK_EXAMPLE="""
Here's the BigQuery data model, encompassing both the logical structure and physical BigQuery DDL suggestions, based on your requirements and provided schema.

---

### BigQuery Data Model

This model is designed to optimize for tracking Total Sales Amount, Number of Orders, Average Order Value, Customer Acquisition Cost (CAC), and Customer Lifetime Value (LTV), leveraging BigQuery's capabilities for performance.

### 1. Logical Data Model

The logical data model defines the tables, their columns, data types, and relationships in a star schema configuration.

#### Fact Tables

**1.1. `Fact_sales`**

*   **Description:** Primary fact table, recording every individual item sold within an order.
*   **Grain:** One row per order item.
*   **Columns:**
    *   `order_item_id` (STRING/INT64): Unique identifier for the order item.
    *   `order_id` (STRING): Unique identifier for the overall order.
    *   `customer_key` (INT64): Foreign Key to `Dim_customer`.
    *   `product_key` (INT64): Foreign Key to `Dim_product`.
    *   `order_date_key` (INT64): Foreign Key to `Dim_Date`.
    *   `shipping_address_key` (INT64): Foreign Key to `Dim_shipping_address`.
    *   `quantity` (INT64): Number of units of the product sold in this item.
    *   `unit_price_at_sale` (NUMERIC): Price per unit at the time of sale.
    *   `item_sales_amount` (NUMERIC): Total revenue for this item (`quantity * unit_price_at_sale - discount_amount`).
    *   `discount_amount` (NUMERIC): Discount applied to this item.
    *   `order_status` (STRING): Status of the order.
    *   `payment_method` (STRING): Method used for payment.
    *   `shipping_cost` (NUMERIC): Shipping cost for this item/allocated portion.
    *   `order_timestamp` (TIMESTAMP): Full timestamp of the order.

**1.2. `Fact_customer_acquisition_ltv`**

*   **Description:** Stores metrics related to customer acquisition and lifetime value.
*   **Grain:** One row per customer per acquisition event or LTV calculation snapshot.
*   **Columns:**
    *   `customer_acquisition_key` (INT64): Primary Key (Surrogate Key).
    *   `customer_key` (INT64): Foreign Key to `Dim_customer`.
    *   `acquisition_date_key` (INT64): Foreign Key to `Dim_Date` (customer acquisition date).
    *   `acquisition_channel` (STRING): Marketing channel for acquisition.
    *   `customer_acquisition_cost` (NUMERIC): Cost incurred to acquire this customer.
    *   `lifetime_value_to_date` (NUMERIC): Calculated Customer Lifetime Value.
    *   `ltv_calculation_date_key` (INT64): Foreign Key to `Dim_Date` (LTV calculation date).

#### Dimension Tables

**1.3. `Dim_customer`**

*   **Description:** Stores detailed information about each customer.
*   **Columns:**
    *   `customer_key` (INT64): Primary Key (Surrogate Key).
    *   `customer_id` (STRING): Unique ID from source system.
    *   `first_name` (STRING)
    *   `last_name` (STRING)
    *   `email` (STRING)
    *   `phone_number` (STRING)
    *   `registration_date` (DATE)
    *   `last_login_date` (DATE)
    *   `loyalty_status` (STRING)
    *   `birth_date` (DATE)
    *   `gender` (STRING)
    *   `city` (STRING)
    *   `state` (STRING)
    *   `country` (STRING)

**1.4. `Dim_product`**

*   **Description:** Contains comprehensive attributes for each product.
*   **Columns:**
    *   `product_key` (INT64): Primary Key (Surrogate Key).
    *   `product_id` (STRING): Unique ID from source system.
    *   `product_name` (STRING)
    *   `sku` (STRING)
    *   `category` (STRING)
    *   `subcategory` (STRING)
    *   `brand` (STRING)
    *   `color` (STRING)
    *   `size` (STRING)
    *   `current_list_price` (NUMERIC)
    *   `product_status` (STRING)

**1.5. `Dim_Date` (Conformed Time Dimension)**

*   **Description:** Provides comprehensive time-based attributes.
*   **Columns:**
    *   `time_key` (INT64): Primary Key (Surrogate Key, YYYYMMDD format).
    *   `full_date` (DATE): The actual date value.
    *   `day_of_week` (INT64)
    *   `day_name` (STRING)
    *   `day_of_month` (INT64)
    *   `day_of_year` (INT64)
    *   `week_of_year` (INT64)
    *   `month_number` (INT64)
    *   `month_name` (STRING)
    *   `quarter` (INT64)
    *   `year` (INT64)
    *   `is_weekend` (BOOLEAN)
    *   `is_holiday` (BOOLEAN)

**1.6. `Dim_shipping_address`**

*   **Description:** Stores details of shipping addresses.
*   **Columns:**
    *   `shipping_address_key` (INT64): Primary Key (Surrogate Key).
    *   `address_id` (STRING): Unique ID from source system (if available).
    *   `address_line1` (STRING)
    *   `address_line2` (STRING)
    *   `city` (STRING)
    *   `state` (STRING)
    *   `zip_code` (STRING)
    *   `country` (STRING)
    *   `latitude` (NUMERIC)
    *   `longitude` (NUMERIC)

#### Relationships

*   **`Fact_sales`**
    *   `customer_key` â†’ `Dim_customer.customer_key`
    *   `product_key` â†’ `Dim_product.product_key`
    *   `order_date_key` â†’ `Dim_Date.time_key`
    *   `shipping_address_key` â†’ `Dim_shipping_address.shipping_address_key`
*   **`Fact_customer_acquisition_ltv`**
    *   `customer_key` â†’ `Dim_customer.customer_key`
    *   `acquisition_date_key` â†’ `Dim_Date.time_key`
    *   `ltv_calculation_date_key` â†’ `Dim_Date.time_key`

---

### 2. Physical Suggestions Model (BigQuery DDL)

Here are the `CREATE TABLE` statements for BigQuery, incorporating recommended optimizations.

```sql
-- DDL for Dimension Tables

CREATE TABLE IF NOT EXISTS `<project_id>.<dataset_id>.Dim_customer` (
    customer_key INT64 NOT NULL OPTIONS(description="Primary Key (Surrogate Key)"),
    customer_id STRING OPTIONS(description="Unique identifier from the source system"),
    first_name STRING,
    last_name STRING,
    email STRING,
    phone_number STRING,
    registration_date DATE,
    last_login_date DATE,
    loyalty_status STRING,
    birth_date DATE,
    gender STRING,
    city STRING,
    state STRING,
    country STRING
)
OPTIONS(
    description="Stores detailed information about each customer."
);

CREATE TABLE IF NOT EXISTS `<project_id>.<dataset_id>.Dim_product` (
    product_key INT64 NOT NULL OPTIONS(description="Primary Key (Surrogate Key)"),
    product_id STRING OPTIONS(description="Unique identifier from the source system"),
    product_name STRING,
    sku STRING OPTIONS(description="Stock Keeping Unit"),
    category STRING OPTIONS(description="Primary product category"),
    subcategory STRING OPTIONS(description="Secondary product category"),
    brand STRING,
    color STRING,
    size STRING,
    current_list_price NUMERIC OPTIONS(description="The current standard list price of the product."),
    product_status STRING OPTIONS(description="E.g., 'Active', 'Discontinued'")
)
OPTIONS(
    description="Contains comprehensive attributes for each product."
);

CREATE TABLE IF NOT EXISTS `<project_id>.<dataset_id>.Dim_Date` (
    time_key INT64 NOT NULL OPTIONS(description="Primary Key (Surrogate Key), typically in YYYYMMDD format"),
    full_date DATE OPTIONS(description="The actual date value"),
    day_of_week INT64,
    day_name STRING,
    day_of_month INT64,
    day_of_year INT64,
    week_of_year INT64,
    month_number INT64,
    month_name STRING,
    quarter INT64,
    year INT64,
    is_weekend BOOLEAN,
    is_holiday BOOLEAN
)
OPTIONS(
    description="A conformed dimension providing comprehensive time-based attributes for analytical purposes."
);

CREATE TABLE IF NOT EXISTS `<project_id>.<dataset_id>.Dim_shipping_address` (
    shipping_address_key INT64 NOT NULL OPTIONS(description="Primary Key (Surrogate Key)"),
    address_id STRING OPTIONS(description="Unique identifier from the source system (if available)"),
    address_line1 STRING,
    address_line2 STRING,
    city STRING,
    state STRING,
    zip_code STRING OPTIONS(description="Customer's shipping ZIP code"),
    country STRING,
    latitude NUMERIC OPTIONS(description="Optional, for geographic analysis"),
    longitude NUMERIC OPTIONS(description="Optional, for geographic analysis")
)
OPTIONS(
    description="Stores details of shipping addresses. Assumes the linked address captures the state at the time of transaction."
);

-- DDL for Fact Tables

CREATE TABLE IF NOT EXISTS `<project_id>.<dataset_id>.Fact_sales` (
    order_item_id STRING OPTIONS(description="Unique identifier for the order item."),
    order_id STRING OPTIONS(description="Unique identifier for the overall order."),
    customer_key INT64 NOT NULL OPTIONS(description="Foreign Key to Dim_customer."),
    product_key INT64 NOT NULL OPTIONS(description="Foreign Key to Dim_product."),
    order_date_key INT64 NOT NULL OPTIONS(description="Foreign Key to Dim_Date (representing the date of the order)."),
    shipping_address_key INT64 NOT NULL OPTIONS(description="Foreign Key to Dim_shipping_address (the address used for shipping at the time of the order)."),
    quantity INT64 OPTIONS(description="Number of units of the product sold in this item."),
    unit_price_at_sale NUMERIC OPTIONS(description="Price per unit at the time of sale before any item-specific discounts."),
    item_sales_amount NUMERIC OPTIONS(description="The total revenue for this specific item, calculated as (quantity * unit_price_at_sale) - discount_amount. Represents the Total Sales Amount at the item level."),
    discount_amount NUMERIC OPTIONS(description="Discount applied specifically to this item."),
    order_status STRING OPTIONS(description="Status of the overall order (e.g., 'Completed', 'Pending', 'Cancelled')."),
    payment_method STRING OPTIONS(description="Method used for payment (e.g., 'Credit Card', 'PayPal')."),
    shipping_cost NUMERIC OPTIONS(description="Shipping cost associated with this item (or allocated portion of total order shipping)."),
    order_timestamp TIMESTAMP OPTIONS(description="Full timestamp of the order, critical for time-based partitioning.")
)
PARTITION BY DATE(order_timestamp) -- Daily partitioning for time-based queries
CLUSTER BY customer_key, product_key, order_id -- Clustering for optimized joins and aggregations
OPTIONS(
    description="Primary fact table, recording every individual item sold within an order. Most granular level for sales analysis."
);

CREATE TABLE IF NOT EXISTS `<project_id>.<dataset_id>.Fact_customer_acquisition_ltv` (
    customer_acquisition_key INT64 NOT NULL OPTIONS(description="Primary Key (Surrogate Key)."),
    customer_key INT64 NOT NULL OPTIONS(description="Foreign Key to Dim_customer."),
    acquisition_date_key INT64 NOT NULL OPTIONS(description="Foreign Key to Dim_Date (the date the customer was acquired)."),
    acquisition_channel STRING OPTIONS(description="The marketing channel through which the customer was acquired (e.g., 'Organic Search', 'Paid Social')."),
    customer_acquisition_cost NUMERIC OPTIONS(description="The cost incurred to acquire this specific customer."),
    lifetime_value_to_date NUMERIC OPTIONS(description="The calculated Customer Lifetime Value up to a given calculation date."),
    ltv_calculation_date_key INT64 NOT NULL OPTIONS(description="Foreign Key to Dim_Date (the date when the LTV was calculated or last updated).")
)
CLUSTER BY customer_key -- Clustering for efficient customer-centric queries
OPTIONS(
    description="Fact table storing metrics directly related to customer acquisition and lifetime value, attributed at the customer level."
);
```

**Note on Usage:**
Replace `<project_id>` and `<dataset_id>` with your actual Google Cloud Project ID and BigQuery Dataset ID where you intend to create these tables.

---

### Key Metric Tracking & Derivation (BigQuery Examples)

These examples show how to derive the specified KPIs using the defined model.

*   **Total Sales Amount:**
    ```sql
    SELECT
        SUM(fs.item_sales_amount) AS total_sales_amount
    FROM
        `<project_id>.<dataset_id>.Fact_sales` AS fs;
    ```

*   **Number of Orders:**
    ```sql
    SELECT
        COUNT(DISTINCT fs.order_id) AS number_of_orders
    FROM
        `<project_id>.<dataset_id>.Fact_sales` AS fs;
    ```

*   **Average Order Value:**
    ```sql
    SELECT
        SUM(fs.item_sales_amount) / COUNT(DISTINCT fs.order_id) AS average_order_value
    FROM
        `<project_id>.<dataset_id>.Fact_sales` AS fs;
    ```

*   **Customer Acquisition Cost (CAC):**
    ```sql
    SELECT
        AVG(facl.customer_acquisition_cost) AS average_customer_acquisition_cost
    FROM
        `<project_id>.<dataset_id>.Fact_customer_acquisition_ltv` AS facl;
    ```

*   **Customer Lifetime Value (LTV):**
    ```sql
    SELECT
        AVG(facl.lifetime_value_to_date) AS average_customer_lifetime_value
    FROM
        `<project_id>.<dataset_id>.Fact_customer_acquisition_ltv` AS facl;
    ```
"""