/*
 * Copyright 2019 Google LLC All rights reserved.
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

package com.google.cloud.example

import com.google.bigtable.v2.{ReadRowsRequest, Row, RowRange, RowSet}
import com.google.cloud.bigtable.config.BigtableOptions
import com.google.cloud.bigtable.grpc.{BigtableDataClient, BigtableSession}
import com.google.cloud.bigtable.grpc.scanner.ResultScanner
import com.google.cloud.example.protobuf.{Metrics, VMMetrics}
import com.google.protobuf.ByteString

import scala.collection.mutable.ArrayBuffer

object CloudQuery extends Logging {
  case class Config(project: String = "myproject",
                    instance: String = "metrics",
                    table: String = "metrics",
                    dc: String = "dc",
                    region: String = "region",
                    host: String = "host",
                    limit: Long = 1,
                    window: Long = 60 * 60,
                    topN: Int = 3,
                    minCpu: Float = 0.8f)

  case class VMCpu(vmid: String, cpu: Float)
  case class Response(host: String, ts: Long, vms: Seq[VMCpu])

  val Parser: scopt.OptionParser[Config] =
    new scopt.OptionParser[Config]("CloudQuery") {
      head("CloudQuery", "0.1")

      opt[String]('p', "project")
        .required()
        .action{(x, c) => c.copy(project = x)}
        .text("projectId is a string property")

      opt[String]('i', "instance")
        .required()
        .action{(x, c) => c.copy(instance = x)}
        .text("instance is a string property")

      opt[String]('t', "table")
        .required()
        .action{(x, c) => c.copy(table = x)}
        .text("table is a string property")

      opt[String]('d',"dc")
        .required()
        .action{(x, c) => c.copy(dc = x)}
        .text("dc is a string property")

      opt[String]('r',"region")
        .required()
        .action{(x, c) => c.copy(region = x)}
        .text("region is a string property")

      opt[String]('h',"host")
        .required()
        .action{(x, c) => c.copy(host = x)}
        .text("host is a string property")

      opt[Int]('n',"topN")
        .action{(x, c) => c.copy(topN = x)}
        .text("topN is an Int property")

      opt[Double]('m',"minCpu")
        .action{(x, c) => c.copy(minCpu = x.toFloat)}
        .text("minCpu is a Float property")

      opt[Long]('w',"window")
        .action{(x, c) => c.copy(window = x)}
        .text("lookback window in seconds")

      note("Queries Metrics from Bigtable")

      help("help")
        .text("prints this usage text")
    }

  def main(args: Array[String]): Unit = {
    Parser.parse(args, Config()) match {
      case Some(config) =>
        val opts = BigtableOptions.builder()
          .setProjectId(config.project)
          .setInstanceId(config.instance)
          .setUserAgent("CloudQuery")
          .build()
        val session = new BigtableSession(opts)
        val bigtable = session.getDataClient
        run(config, bigtable)

      case _ =>
    }
  }

  /**
    *
    * @param config
    * @param bigtable
    */
  def run(config: Config, bigtable: BigtableDataClient): Unit = {
    val t = System.currentTimeMillis()/1000
    val tableName = s"projects/${config.project}/instances/${config.instance}/tables/${config.table}"
    val responses = run1(t, config.window, config.limit, config.dc, config.region, config.host, config.topN, config.minCpu, tableName, bigtable)
    if (responses.isEmpty)
      logger.info(s"no data for ${config.host}")
    else
      responses.foreach{response =>
        val vms = response.vms
          .map(vm => s"${vm.vmid}\t${vm.cpu}")
          .mkString("\n")
        logger.info(s"top ${config.topN} for ${config.host} at t = ${response.ts}:\n$vms")
      }
  }

  /**
    *
    * @param t
    * @param window
    * @param limit
    * @param dc
    * @param region
    * @param host
    * @param topN
    * @param minCpu
    * @param tableName
    * @param bigtable
    * @return
    */
  def run1(t: Long, window: Long, limit: Long, dc: String, region: String, host: String, topN: Int, minCpu: Float, tableName: String, bigtable: BigtableDataClient): Seq[Response] = {
    val rows = query(t0 = t-window, t1 = t, limit, dc, region, host, tableName, bigtable)
    val metrics = readMetrics(rows)
    processMetrics(metrics, topN, minCpu)
      .map{x => Response(host, ts = x._1, vms = x._2)}
  }

  def createRowKey(metric: String): ByteString = {
    val dc = metric.substring(0,6)
    val region = metric.substring(7,10)
    val host = metric.substring(11,20)
    ByteString.copyFromUtf8(s"$dc#$region#$host")
  }

  def processMetrics(metrics: Seq[Metrics], topN: Int, minCpu: Float): Seq[(Long,Seq[VMCpu])] = {
    metrics.map(findTopNVm(_, topN, minCpu))
  }

  /** Find top N VMs by CPU utilization
    *
    * @param metric Metrics proto message
    * @param n max results
    * @param minCpu inclusion threshold
    * @return
    */
  def findTopNVm(metric: Metrics, n: Int, minCpu: Float): (Long, Seq[VMCpu]) = {
    import scala.collection.JavaConverters.iterableAsScalaIterableConverter
    val vms = metric.getVmList.asScala.toArray
    util.Sorting.quickSort(vms)(VMUtilizationOrdering.reverse)
    val top = vms
      .filter(_.getCpu.getCpuDataCputimePercent >= minCpu)
      .take(n)
      .map{x => VMCpu(x.getVmid, x.getCpu.getCpuDataCputimePercent)}
    (metric.getTimestamp, top)
  }

  object VMUtilizationOrdering extends Ordering[VMMetrics] {
    override def compare(x: VMMetrics, y: VMMetrics): Int = {
      if (x.getCpu.getCpuDataCputimePercent < y.getCpu.getCpuDataCputimePercent) -1
      else if (x.getCpu.getCpuDataCputimePercent > y.getCpu.getCpuDataCputimePercent) 1
      else 0
    }
  }

  def query(t0: Long, t1: Long, limit: Long, dc: String, region: String, host: String, tableName: String, client: BigtableDataClient): ResultScanner[Row] = {
    val request = ReadRowsRequest.newBuilder()
      .setTableName(tableName)
      .setRows(RowSet.newBuilder()
        .addRowRanges(RowRange.newBuilder()
          .setStartKeyOpen(RowKeys.byHost(host, dc, region, t0))
          .setEndKeyOpen(RowKeys.byHost(host, dc, region, t1))
        ))
      .setRowsLimit(limit)
      .build()
    client.readRows(request)
  }

  /** Parsing a proto message from a Bigtable Row */
  def readMetricsRow(row: Row): Metrics = {
    val cell = row
      .getFamilies(0)
      .getColumns(0)
      .getCells(0)
    Metrics.parseFrom(cell.getValue)
  }

  def readMetrics(rows: ResultScanner[Row]): IndexedSeq[Metrics] = {
    val buf = ArrayBuffer.empty[Metrics]
    var next: Option[Row] = Option(rows.next())
    while (next.isDefined) {
      buf.append(readMetricsRow(next.get))
      next = Option(rows.next())
    }
    buf.result().toIndexedSeq
  }
}
