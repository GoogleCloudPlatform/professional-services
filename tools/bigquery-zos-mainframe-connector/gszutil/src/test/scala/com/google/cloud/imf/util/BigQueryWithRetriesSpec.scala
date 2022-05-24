/*
 * Copyright 2022 Google LLC All Rights Reserved
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

package com.google.cloud.imf.util

import com.google.cloud.bigquery._
import org.mockito.Mockito
import org.mockito.internal.verification.Times
import org.scalatest.flatspec.AnyFlatSpec

class BigQueryWithRetriesSpec extends AnyFlatSpec {
  private val error = new BigQueryException(500, "internal error")
  private val nonRetriableError = new BigQueryException(500, "Already Exists: Job .....")

  it should "Crash and retry for BigQuery.create()" in {
    val cfg = QueryJobConfiguration.newBuilder("select 1;").build()
    val jobInfo = JobInfo.of(JobId.of("dummy"), cfg)

    val bq = Mockito.mock(classOf[BigQuery])
    Mockito.when(bq.create(jobInfo)).thenThrow(error)

    val storageWithRetries = new BigQueryWithRetries(bq, 1, 5)
    assertThrows[BigQueryException](storageWithRetries.create(jobInfo))
    Mockito.verify(bq, new Times(2)).create(jobInfo)
  }

  it should "Crash for BigQuery.create()" in {
    val cfg = QueryJobConfiguration.newBuilder("select 1;").build()
    val jobInfo = JobInfo.of(JobId.of("dummy"), cfg)

    val bq = Mockito.mock(classOf[BigQuery])
    Mockito.when(bq.create(jobInfo)).thenThrow(nonRetriableError)

    val storageWithRetries = new BigQueryWithRetries(bq, 2, 5)
    assertThrows[BigQueryException](storageWithRetries.create(jobInfo))
    Mockito.verify(bq, new Times(1)).create(jobInfo)
  }

  it should "Crash and retry for BigQuery.create() 2" in {
    val datasetInfo = DatasetInfo.newBuilder("dummy").build()
    val bq = Mockito.mock(classOf[BigQuery])
    Mockito.when(bq.create(datasetInfo)).thenThrow(error)

    val storageWithRetries = new BigQueryWithRetries(bq, 1, 5)
    assertThrows[BigQueryException](storageWithRetries.create(datasetInfo))
    Mockito.verify(bq, new Times(2)).create(datasetInfo)
  }

  it should "Crash for BigQuery.create() 2" in {
    val datasetInfo = DatasetInfo.newBuilder("dummy").build()
    val bq = Mockito.mock(classOf[BigQuery])
    Mockito.when(bq.create(datasetInfo)).thenThrow(nonRetriableError)

    val storageWithRetries = new BigQueryWithRetries(bq, 2, 5)
    assertThrows[BigQueryException](storageWithRetries.create(datasetInfo))
    Mockito.verify(bq, new Times(1)).create(datasetInfo)
  }
  it should "Crash and retry for BigQuery.create() 3" in {
    val tableInfo = TableInfo.of(TableId.of("dummy", "dummy"), StandardTableDefinition.newBuilder().build())

    val bq = Mockito.mock(classOf[BigQuery])
    Mockito.when(bq.create(tableInfo)).thenThrow(error)

    val storageWithRetries = new BigQueryWithRetries(bq, 1, 5)
    assertThrows[BigQueryException](storageWithRetries.create(tableInfo))
    Mockito.verify(bq, new Times(2)).create(tableInfo)
  }

  it should "Crash for BigQuery.create() 3" in {
    val tableInfo = TableInfo.of(TableId.of("dummy", "dummy"), StandardTableDefinition.newBuilder().build())
    val bq = Mockito.mock(classOf[BigQuery])
    Mockito.when(bq.create(tableInfo)).thenThrow(nonRetriableError)

    val storageWithRetries = new BigQueryWithRetries(bq, 2, 5)
    assertThrows[BigQueryException](storageWithRetries.create(tableInfo))
    Mockito.verify(bq, new Times(1)).create(tableInfo)
  }
  it should "Crash and retry for BigQuery.create() 4" in {
    val routineInfo = RoutineInfo.of(RoutineId.of("dummy", "dummy"))

    val bq = Mockito.mock(classOf[BigQuery])
    Mockito.when(bq.create(routineInfo)).thenThrow(error)

    val storageWithRetries = new BigQueryWithRetries(bq, 1, 5)
    assertThrows[BigQueryException](storageWithRetries.create(routineInfo))
    Mockito.verify(bq, new Times(2)).create(routineInfo)
  }

  it should "Crash for BigQuery.create() 4" in {
    val routineInfo = RoutineInfo.of(RoutineId.of("dummy", "dummy"))
    val bq = Mockito.mock(classOf[BigQuery])
    Mockito.when(bq.create(routineInfo)).thenThrow(nonRetriableError)

    val storageWithRetries = new BigQueryWithRetries(bq, 2, 5)
    assertThrows[BigQueryException](storageWithRetries.create(routineInfo))
    Mockito.verify(bq, new Times(1)).create(routineInfo)
  }

  it should "Crash and retry for BigQuery.getJob()" in {
    val bq = Mockito.mock(classOf[BigQuery])
    val jobId = "dummy"
    Mockito.when(bq.getJob(jobId)).thenThrow(error)

    val storageWithRetries = new BigQueryWithRetries(bq, 1, 5)
    assertThrows[BigQueryException](storageWithRetries.getJob(jobId))
    Mockito.verify(bq, new Times(2)).getJob(jobId)
  }

  it should "Crash and retry for BigQuery.getJob() 2" in {
    val bq = Mockito.mock(classOf[BigQuery])
    val jobId = JobId.of("dummy")
    Mockito.when(bq.getJob(jobId)).thenThrow(error)

    val storageWithRetries = new BigQueryWithRetries(bq, 1, 5)
    assertThrows[BigQueryException](storageWithRetries.getJob(jobId))
    Mockito.verify(bq, new Times(2)).getJob(jobId)
  }

  it should "Crash and retry for BigQuery.getTable()" in {
    val bq = Mockito.mock(classOf[BigQuery])
    val datasetId = "dummy"
    val tableId = "dummy"
    Mockito.when(bq.getTable(datasetId, tableId)).thenThrow(error)

    val storageWithRetries = new BigQueryWithRetries(bq, 1, 5)
    assertThrows[BigQueryException](storageWithRetries.getTable(datasetId, tableId))
    Mockito.verify(bq, new Times(2)).getTable(datasetId, tableId)
  }

  it should "Crash and retry for BigQuery.getTable() 2" in {
    val bq = Mockito.mock(classOf[BigQuery])
    val tableId = TableId.of("dummy", "dummy")
    Mockito.when(bq.getTable(tableId)).thenThrow(error)

    val storageWithRetries = new BigQueryWithRetries(bq, 1, 5)
    assertThrows[BigQueryException](storageWithRetries.getTable(tableId))
    Mockito.verify(bq, new Times(2)).getTable(tableId)
  }

  it should "Crash and retry for BigQuery.listTableData()" in {
    val bq = Mockito.mock(classOf[BigQuery])
    val datasetId = "dummy"
    val tableId = "dummy"
    Mockito.when(bq.listTableData(datasetId, tableId)).thenThrow(error)

    val storageWithRetries = new BigQueryWithRetries(bq, 1, 5)
    assertThrows[BigQueryException](storageWithRetries.listTableData(datasetId, tableId))
    Mockito.verify(bq, new Times(2)).listTableData(datasetId, tableId)
  }

  it should "Crash and retry for BigQuery.listTableData() 2 " in {
    val bq = Mockito.mock(classOf[BigQuery])
    val tableId = TableId.of("dummy", "dummy")

    Mockito.when(bq.listTableData(tableId)).thenThrow(error)

    val storageWithRetries = new BigQueryWithRetries(bq, 1, 5)
    assertThrows[BigQueryException](storageWithRetries.listTableData(tableId))
    Mockito.verify(bq, new Times(2)).listTableData(tableId)
  }
  it should "Crash and retry for BigQuery.listTableData() 3 " in {
    val bq = Mockito.mock(classOf[BigQuery])
    val datasetId = "dummy"
    val tableId = "dummy"
    val schema = Schema.of()
    Mockito.when(bq.listTableData(datasetId, tableId, schema)).thenThrow(error)

    val storageWithRetries = new BigQueryWithRetries(bq, 1, 5)
    assertThrows[BigQueryException](storageWithRetries.listTableData(datasetId, tableId, schema))
    Mockito.verify(bq, new Times(2)).listTableData(datasetId, tableId, schema)
  }

  it should "Crash and retry for BigQuery.listTableData() 4 " in {
    val bq = Mockito.mock(classOf[BigQuery])
    val tableId = TableId.of("dummy", "dummy")
    val schema = Schema.of()
    Mockito.when(bq.listTableData(tableId, schema)).thenThrow(error)

    val storageWithRetries = new BigQueryWithRetries(bq, 1, 5)
    assertThrows[BigQueryException](storageWithRetries.listTableData(tableId, schema))
    Mockito.verify(bq, new Times(2)).listTableData(tableId, schema)
  }

  //negative cases
  it should "Crash for BigQuery.delete()" in {
    val bq = Mockito.mock(classOf[BigQuery])
    val tableId = TableId.of("dummy", "dummy")

    Mockito.when(bq.delete(tableId)).thenThrow(error)

    val storageWithRetries = new BigQueryWithRetries(bq, 2, 5)
    assertThrows[BigQueryException](storageWithRetries.delete(tableId))
    Mockito.verify(bq, new Times(1)).delete(tableId)
  }

  it should "Crash for BigQuery.update()" in {
    val bq = Mockito.mock(classOf[BigQuery])
    val tableId = TableId.of("dummy", "dummy")
    val tableInfo = TableInfo.of(tableId, StandardTableDefinition.newBuilder().build())
    Mockito.when(bq.update(tableInfo)).thenThrow(error)

    val storageWithRetries = new BigQueryWithRetries(bq, 2, 5)
    assertThrows[BigQueryException](storageWithRetries.update(tableInfo))
    Mockito.verify(bq, new Times(1)).update(tableInfo)
  }


}
