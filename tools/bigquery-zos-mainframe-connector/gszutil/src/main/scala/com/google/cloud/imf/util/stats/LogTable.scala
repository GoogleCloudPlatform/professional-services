/*
 * Copyright 2020 Google LLC All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.google.cloud.imf.util.stats

import com.google.cloud.bigquery.Field.Mode.NULLABLE
import com.google.cloud.bigquery.StandardSQLTypeName.{FLOAT64, INT64}
import com.google.cloud.bqsh.BQ.{BQField, BQSchema}


object LogTable {
  // schema version 2021-01-14
  val schema: BQSchema = {
    BQSchema(Seq(
      BQField("timestamp"),
      BQField("job_id"),
      BQField("job_name"),
      BQField("job_date"),
      BQField("job_time"),
      BQField("job_step_name"),
      BQField("job_type"),
      BQField("source"),
      BQField("destination"),
      BQField("job_json"),
      BQField("rows_read", INT64, NULLABLE),
      BQField("rows_written", INT64, NULLABLE),
      BQField("rows_affected", INT64, NULLABLE),
      BQField("rows_inserted", INT64, NULLABLE),
      BQField("rows_deleted", INT64, NULLABLE),
      BQField("rows_updated", INT64, NULLABLE),
      BQField("rows_unmodified", INT64, NULLABLE),
      BQField("rows_before_merge", INT64, NULLABLE),
      BQField("rows_loaded", INT64, NULLABLE),
      BQField("bq_job_id"),
      BQField("bq_job_project"),
      BQField("bq_job_location"),
      BQField("statement_type"),
      BQField("query"),
      BQField("execution_ms", INT64, NULLABLE),
      BQField("queued_ms", INT64, NULLABLE),
      BQField("bytes_processed", INT64, NULLABLE),
      BQField("slot_ms", INT64, NULLABLE),
      BQField("slot_utilization_rate", FLOAT64, NULLABLE),
      BQField("slot_ms_to_total_bytes_ratio", FLOAT64, NULLABLE),
      BQField("shuffle_bytes", FLOAT64, NULLABLE),
      BQField("shuffle_bytes_to_total_bytes_ratio", FLOAT64, NULLABLE),
      BQField("shuffle_spill_bytes", FLOAT64, NULLABLE),
      BQField("shuffle_spill_bytes_to_shuffle_bytes_ratio", FLOAT64, NULLABLE),
      BQField("shuffle_spill_bytes_to_total_bytes_ratio", FLOAT64, NULLABLE),
      BQField("shuffle_spill_gb", FLOAT64, NULLABLE),
      BQField("bq_stage_count", INT64, NULLABLE),
      BQField("bq_step_count", INT64, NULLABLE),
      BQField("bq_sub_step_count", INT64, NULLABLE),
      BQField("bq_stage_summary"),
    ))
  }
}
