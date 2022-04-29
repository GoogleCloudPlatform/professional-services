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

package com.google.cloud.bqsh

import org.scalatest.flatspec.AnyFlatSpec

class ParserITSpec extends AnyFlatSpec {
  "MkOptionParser" should "parse" in {
    val args = Seq(
      "bq",
      "mk",
      "--project_id=project",
      "--dataset_id=dataset",
      "--clustering_fields=id1,id2",
      "--time_partitioning_field=date",
      "--time_partitioning_expiration=31536000",
      "--description=\"this is a table\"",
      "--external_table_definition=ORC=gs://bucket/bucket/path.orc/*",
      "TABLE_NAME"
    )
    val parsed1 = BqshParser.parse(args)
    assert(parsed1.isDefined)
    val parsed = MkOptionParser.parse(parsed1.get.args.drop(1), sys.env)
    assert(parsed.isDefined)
    assert(parsed.get.timePartitioningExpiration == 31536000)
    assert(parsed.get.timePartitioningField == "date")
    assert(parsed.get.clusteringFields == Seq("id1","id2"))
    assert(parsed.get.description == "this is a table")
  }

  "LoadOptionParser" should "parse" in {
    val args = Seq(
      "bq",
      "load",
      "--project_id=project",
      "--dataset_id=dataset",
      "--source_format=ORC",
      "--replace",
      "--clustering_fields=id1,id2",
      "--time_partitioning_field=date",
      "--time_partitioning_expiration=31536000",
      "TABLE_NAME",
      "gs://bucket/bucket/path.orc/*"
    )
    val parsed1 = BqshParser.parse(args)
    assert(parsed1.isDefined)
    val parsed = LoadOptionParser.parse(parsed1.get.args.drop(1), sys.env)
    assert(parsed.isDefined)
    val opts = parsed.get
    assert(opts.replace)
    assert(opts.clusteringFields == Seq("id1","id2"))
    assert(opts.time_partitioning_expiration == 31536000)
    assert(opts.time_partitioning_field == "date")
    assert(opts.source_format == "ORC")
  }

  "QueryOptionParser" should "parse" in {
    val args = Seq(
      "bq",
      "query",
      "--project_id=project",
      "--dataset_id=dataset",
      "--replace",
      "--parameters_from_file=DATE::DDNAME",
      "--destination_table=TABLE_NAME"
    )
    val parsed1 = BqshParser.parse(args)
    assert(parsed1.isDefined)
    val parsed = QueryOptionParser.parse(parsed1.get.args.drop(1), sys.env)
    assert(parsed.isDefined)
  }

  it should "parse asynchronous batch mode" in {
    val args = Seq(
      "bq",
      "query",
      "--project_id=project",
      "--dataset_id=dataset",
      "--replace",
      "--sync=false",
      "--batch",
      "--parameters_from_file=DATE::DDNAME",
      "--destination_table=TABLE_NAME"
    )
    val parsed1 = BqshParser.parse(args)
    assert(parsed1.isDefined)
    val parsed = QueryOptionParser.parse(parsed1.get.args.drop(1), sys.env)
    assert(parsed.isDefined)
    assert(!parsed.get.sync)
  }

  it should "parse with spaces" in {
    val args = Seq(
      "bq",
      "query",
      "--project_id", "project",
      "--dataset_id", "dataset",
      "--replace",
      "--parameters_from_file", "DATE::DDNAME",
      "--destination_table", "TABLE_NAME"
    )
    val parsed1 = BqshParser.parse(args)
    assert(parsed1.isDefined)
    val parsed = QueryOptionParser.parse(parsed1.get.args.drop(1), sys.env)
    assert(parsed.isDefined)
  }

  "RmOptionParser" should "parse" in {
    val args = Seq(
      "bq",
      "rm",
      "--project_id=project",
      "--dataset_id=dataset",
      "--table",
      "TABLE_NAME"
    )
    val parsed1 = BqshParser.parse(args)
    assert(parsed1.isDefined)
    val parsed = RmOptionParser.parse(parsed1.get.args.drop(1), sys.env)
    assert(parsed.isDefined)
  }

  "GsUtilRmOptionParser" should "parse" in {
    val args = Seq(
      "gsutil",
      "rm",
      "gs://bucket/path"
    )
    val parsed1 = BqshParser.parse(args)
    assert(parsed1.isDefined)
    val parsed = GsUtilOptionParser.parse(parsed1.get.args, sys.env)
    assert(parsed.isDefined)
    assert(parsed.get.mode == "rm")
    assert(parsed.get.gcsUri == "gs://bucket/path")
  }

  "GsUtilCpOptionParser" should "parse" in {
    val args = Seq(
      "gsutil",
      "cp",
      "-m",
      "--parallelism=4",
      "--replace",
      "--timeOutMinutes=120",
      "--tfGCS=gs://BUCKET/t13i/tr.json",
      "gs://bucket/path"
    )
    val parsed1 = BqshParser.parse(args)
    assert(parsed1.isDefined)
    assert(parsed1.get.name == "gsutil")
    val parsed = GsUtilOptionParser.parse(parsed1.get.args, sys.env)
    assert(parsed.isDefined)
    assert(parsed.get.replace)
    assert(parsed.get.mode == "cp")
    assert(parsed.get.parallelism == 4)
    assert(parsed.get.timeOutMinutes == 120)
    assert(parsed.get.replace)
    assert(parsed.get.gcsUri == "gs://bucket/path")
    assert(parsed.get.tfGCS =="gs://BUCKET/t13i/tr.json")
  }

  it should "cp 1" in {
    val args = "gsutil cp gs://bucket/object /path/to/file".split(" ").toIndexedSeq
    val parsed1 = BqshParser.parse(args)
    assert(parsed1.isDefined)
    assert(parsed1.get.name == "gsutil")

    val parsed = GsUtilOptionParser.parse(parsed1.get.args, sys.env)
    assert(parsed.isDefined)
    assert(parsed.get.mode == "cp")
    assert(parsed.get.gcsUri == "gs://bucket/object")
    assert(parsed.get.destPath == "/path/to/file")
    assert(parsed.get.destDSN == "")
  }

  it should "cp 2" in {
    val args = "gsutil cp gs://bucket/object HLQ.FILE".split(" ").toIndexedSeq
    val parsed1 = BqshParser.parse(args)
    assert(parsed1.isDefined)
    assert(parsed1.get.name == "gsutil")

    val parsed = GsUtilOptionParser.parse(parsed1.get.args, sys.env)
    assert(parsed.isDefined)
    assert(parsed.get.mode == "cp")
    assert(parsed.get.gcsUri == "gs://bucket/object")
    assert(parsed.get.destPath == "")
    assert(parsed.get.destDSN == "HLQ.FILE")
  }

  "Bqsh" should "split SQL" in {
    val queryString =
      """-- comment
        | SELECT 1 FROM DUAL;
        | SELECT 2 FROM DUAL;
        |""".stripMargin
    val split = Bqsh.splitSQL(queryString)
    val expected = Seq(
      "-- comment\n SELECT 1 FROM DUAL",
      "SELECT 2 FROM DUAL"
    )
    assert(split == expected)
  }

  it should "split SQL with backticks and quotes" in {
    // see https://cloud.google.com/bigquery/docs/reference/standard-sql/lexical for allowed quoting styles
    val bs = "\\"
    val tq = "\"\"\""
    val newline = "\n"
    val line2 = s""" SELECT "abc","it's",'it${bs}'s','Title: "Boy"',${tq}abc${tq},'''it's''','''Title:"Boy"''','''two${newline}lines''','''why${bs}?''' FROM `my-project.dataset.table1`"""
    val queryString =
      s"""-- comment
        |$line2;
        | SELECT 2 FROM `my-project.dataset.table2`;
        |""".stripMargin
    val split = Bqsh.splitSQL(queryString)
    val expected = Seq(
      s"""-- comment$newline$line2""",
      "SELECT 2 FROM `my-project.dataset.table2`"
    )
    assert(split == expected)
  }
}
