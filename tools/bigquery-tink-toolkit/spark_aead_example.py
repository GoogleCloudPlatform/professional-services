# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from time import sleep

from pyspark.sql import SparkSession
from pyspark.sql.functions import col, lit, udf

from crypto_util import CipherManager


def main(spark):
    # Set variables for BQ tables
    PROJECT_ID = "your_project_id"
    TARGET_DATASET, TARGET_TABLE, TARGET_COLS = (
        "dataset_name",
        "table_name",
        ["credit_card", "transaction_amount"],
    )

    # Read data from Parquet file in GCS
    inputUri = "gs://<your-bucket>/transactions.parquet"
    df_w = spark.read.parquet(inputUri)

    # EXAMPLE 1: Using CipherManager to encrypt columns; Supports list of multiple column names.
    col_ciphers = CipherManager(TARGET_COLS, TARGET_TABLE, TARGET_DATASET)
    col_ciphers_broadcast = spark.sparkContext.broadcast(col_ciphers)

    encrypt_udf = udf(
        lambda col_name, plaintext: col_ciphers_broadcast.value.encrypt(
            col_name, plaintext
        )
    ).asNondeterministic()

    df_w = df_w.withColumn(
        "credit_card_encrypted",
        encrypt_udf(lit(TARGET_COLS[0]), col(TARGET_COLS[0]).cast("string")),
    ).withColumn(
        "txn_amt_encrypted",
        encrypt_udf(lit(TARGET_COLS[1]), col(TARGET_COLS[1]).cast("string")),
    )
    df_w.select(
        col("customer_id"),
        col("credit_card"),
        col("transaction_amount"),
        col("credit_card_encrypted"),
        col("txn_amt_encrypted"),
    ).show(20, False)

    # EXAMPLE 2: Write dataframe to BigQuery using Write API (Write API not required, provided as an example).
    # Write the table to BigQuery using the Write API.
    df_w.write.format("bigquery").option("writeMethod", "direct").mode(
        "overwrite"
    ).save(f"{PROJECT_ID}.{TARGET_DATASET}.{TARGET_TABLE}")

    # Sleep to let the Write API streaming buffer clear before reading from it in the next step (connector uses 'Pending' mode - https://cloud.google.com/bigquery/docs/write-api#pending_mode)
    sleep(5)

    # Read table from BigQuery into dataframe using Read API
    df_r = spark.read.format("bigquery").load(
        f"{PROJECT_ID}.{TARGET_DATASET}.{TARGET_TABLE}"
    )

    # # EXAMPLE 3: Decrypt columns using CipherManager object
    decrypt_udf = udf(
        lambda col_name, ciphertext: col_ciphers_broadcast.value.decrypt(
            col_name, ciphertext
        )
    ).asNondeterministic()

    df_r = df_r.select(
        col("credit_card"),
        col("credit_card_encrypted"),
        decrypt_udf(lit(TARGET_COLS[0]), col("credit_card_encrypted")).alias(
            "cc_plaintext"
        ),
        col("transaction_amount"),
        col("txn_amt_encrypted"),
        decrypt_udf(lit(TARGET_COLS[1]), col("txn_amt_encrypted")).alias(
            "txn_plaintext"
        ),
    )
    df_r.show(20, False)


if __name__ == "__main__":
    spark = (
        SparkSession.builder.master("yarn").appName("spark-bigquery-aead").getOrCreate()
    )
    main(spark)
