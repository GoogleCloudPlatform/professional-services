/*
 * Copyright 2019 Google LLC
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

package com.google.cloud.bqhiveloader

import com.google.cloud.bqhiveloader.PartitionFilters.PartitionFilter
import org.apache.spark.sql.types.StructType
import org.apache.spark.sql.{DataFrame, SparkSession}

object MetaStore {
  case class TableMetadata(schema: StructType, partitionColumnNames: Seq[String], location: Option[String] = None, raw: Seq[(String,String)] = Seq.empty)

  case class Partition(values: Seq[(String,String)], location: String)

  trait MetaStore {
    def filterPartitions(db: String, table: String, filterExpression: String): Seq[Partition] = {
      PartitionFilters.parse(filterExpression) match {
        case x: Some[PartitionFilter] =>
          listPartitions(db, table, x)
        case _ =>
          throw new IllegalArgumentException(s"Invalid filter expression '$filterExpression'")
      }
    }
    def listPartitions(db: String, table: String, partitionFilter: Option[PartitionFilter] = None): Seq[Partition]
    def getTable(db: String, table: String): TableMetadata
  }

  case class ExternalCatalogMetaStore(spark: SparkSession) extends MetaStore {
    private val cat = spark.sessionState.catalog.externalCatalog

    override def listPartitions(db: String, table: String, partitionFilter: Option[PartitionFilter] = None): Seq[Partition] = {
      cat.listPartitions(db, table)
        .filter{part =>
          partitionFilter.exists(_.filterPartition(part.spec.toSeq))
        }
        .map{part =>
          Partition(part.spec.toSeq, part.location.toString)
        }
    }

    override def getTable(db: String, table: String): TableMetadata = {
      val tbl = cat.getTable(db, table)
      TableMetadata(tbl.schema, tbl.partitionColumnNames)
    }
  }

  // convert region=EU/date=2019-04-11 to "region" -> "EU", "date" -> "2019-04-11"
  def readPartSpec(s: String): Seq[(String,String)] = {
    s.split('/')
      .map{p =>
        p.split('=') match {
          case Array(l,r) =>
            (l,r.stripPrefix("'").stripSuffix("'"))
        }
      }
  }

  def mkPartSpec(partValues: Iterable[(String,String)]): String =
    partValues.map{x => s"${x._1}='${x._2}'"}.mkString(",")

  def parsePartitionTable(df: DataFrame): Seq[Seq[(String,String)]] = {
    df.collect()
      .map{row =>
        val partition = row.getString(row.fieldIndex("partition"))
        readPartSpec(partition)
      }
  }

  def parsePartitionDesc(partValues: Seq[(String,String)], df: DataFrame): Option[Partition] = {
    val tuples = df.drop("comment")
      .collect()
      .map{row =>
        val colName = row.getString(row.fieldIndex("col_name"))
        val dataType = row.getString(row.fieldIndex("data_type"))
        (colName, dataType)
      }
    parsePartitionDetails(partValues, tuples)
  }

  def parsePartitionDetails(partValues: Seq[(String,String)], data: Seq[(String,String)]): Option[Partition] = {
    data.find(_._1.startsWith("Location"))
      .map{x =>
        val location = x._2
        Partition(partValues, location)
      }
  }

  def parseTableDesc(df: DataFrame): TableMetadata = {
    val tuples = df.drop("comment")
      .collect()
      .map{row =>
        val colName = row.getString(row.fieldIndex("col_name"))
        val dataType = row.getString(row.fieldIndex("data_type"))
        (colName, dataType)
      }
    parseTableDetails(tuples)
  }

  def parseTableDetails(data: Seq[(String,String)]): TableMetadata = {
    System.out.println("Parsing table details:\n" + data.map{x => x._1 + "\t" + x._2}.mkString("\n"))
    val fields = data.takeWhile(!_._1.startsWith("#"))
      .filter(_._1.nonEmpty)
      .map(Mapping.convertTuple)
    val schema = StructType(fields)

    val partColNames = data.map(_._1)
      .dropWhile(!_.startsWith("#"))
      .dropWhile(_.startsWith("#"))
      .takeWhile(_.trim.nonEmpty)

    val location = data.find(_._1.startsWith("Location")).map(_._2)

    TableMetadata(schema, partColNames, location)
  }

  case class SparkSQLMetaStore(spark: SparkSession) extends MetaStore {
    override def listPartitions(db: String, table: String, partitionFilter: Option[PartitionFilter] = None): Seq[Partition] = {
      parsePartitionTable(spark.sql(s"show partitions $table"))
        .filter{partValues =>
          partitionFilter.exists(_.filterPartition(partValues))
        }
        .flatMap{partValues =>
          val partSpec = mkPartSpec(partValues)
          val df = spark.sql(s"describe formatted $table partition($partSpec)")
          parsePartitionDesc(partValues, df)
        }
    }

    override def getTable(db: String, table: String): TableMetadata =
      parseTableDesc(spark.sql(s"describe formatted $table"))
  }
}
