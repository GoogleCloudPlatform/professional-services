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

import java.sql.{Connection, DriverManager, ResultSet, ResultSetMetaData, Types}

import com.google.cloud.bqhiveloader.MetaStore.{MetaStore, Partition, TableMetadata, mkPartSpec, parsePartitionTable}
import com.google.cloud.bqhiveloader.PartitionFilters.PartitionFilter
import org.apache.spark.sql.types.DataTypes.{BooleanType, DoubleType, FloatType, IntegerType, LongType, StringType}
import org.apache.spark.sql.types.{DataType, StructField, StructType}
import org.apache.spark.sql.{DataFrame, Row, SparkSession}

import scala.collection.mutable.ListBuffer

object JDBCMetaStore extends Logging {
  def connect(jdbcUrl: String): Connection = {
    Class.forName("org.apache.hive.jdbc.HiveDriver")
    DriverManager.getConnection(jdbcUrl)
  }

  def convertSqlType(sqlType: Int): DataType = {
    sqlType match {
      case Types.VARCHAR => StringType
      case Types.INTEGER => IntegerType
      case Types.BIGINT => LongType
      case Types.BOOLEAN => BooleanType
      case Types.DOUBLE => DoubleType
      case Types.REAL => DoubleType
      case Types.FLOAT => FloatType
      case Types.CHAR => StringType
      case Types.LONGNVARCHAR => StringType
      case Types.NCHAR => StringType
      case Types.NVARCHAR => StringType
      case Types.SMALLINT => IntegerType
      case Types.TINYINT => IntegerType
      case _ => throw new IllegalArgumentException(s"unsupported type: $sqlType")
    }
  }

  def convertResultSetMetadataToStructType(meta: ResultSetMetaData): StructType = {
    val structFields: Seq[StructField] =
      (1 to meta.getColumnCount).map{i =>
        StructField(
          name = meta.getColumnName(i),
          dataType = convertSqlType(meta.getColumnType(i))
        )
      }
    StructType(structFields)
  }

  def readRowsFromResultSet(rs: ResultSet): Seq[Row] = {
    val buf = ListBuffer.empty[Row]
    while (rs.next()) {
      val colValues: Seq[Any] =
        (1 to rs.getMetaData.getColumnCount)
          .map(rs.getObject)
      val row: Row = Row(colValues: _*)
      buf.append(row)
    }
    buf.result()
  }

  def convertResultSetToDataFrame(rs: ResultSet, spark: SparkSession): DataFrame = {
    val rdd = spark.sparkContext.makeRDD(readRowsFromResultSet(rs), numSlices = 1)
    val schema = convertResultSetMetadataToStructType(rs.getMetaData)
    spark.createDataFrame(rdd, schema)
  }

  def executeQuery(query: String, con: Connection, spark: SparkSession): DataFrame = {
    val stmt = con.createStatement
    val rs = stmt.executeQuery(query)
    convertResultSetToDataFrame(rs, spark)
  }

  def parseTableDesc(df: DataFrame): TableMetadata = {
    val tuples = df.drop("comment")
      .collect()
      .map{row =>
        val colName = Option(row.getString(row.fieldIndex("col_name"))).getOrElse("").trim
        val dataType = Option(row.getString(row.fieldIndex("data_type"))).getOrElse("").trim
        (colName, dataType)
      }
    parseTableDetails(tuples)
  }

  def parseTableDetails(data: Seq[(String,String)]): TableMetadata = {
    val fields = data
      .takeWhile(!_._1.startsWith("# Detailed Table Information"))
      .filterNot(x => x._1.startsWith("#") || x._1.isEmpty)
      .map(Mapping.convertTuple)

    val schema = StructType(fields)

    val partColNames = data.map(_._1)
      .dropWhile(!_.startsWith("# Partition Information"))
      .takeWhile(!_.startsWith("# Detailed Table Information"))
      .filterNot(x => x.startsWith("#") || x.isEmpty)

    val location = data.find(_._1.startsWith("Location")).map(_._2)

    TableMetadata(schema, partColNames, location, data)
  }

  def parsePartitionDesc(partValues: Seq[(String,String)], df: DataFrame): Option[Partition] = {
    val tuples = df.drop("comment")
      .collect()
      .map{row =>
        val colName = Option(row.getString(row.fieldIndex("col_name")))
          .getOrElse("").trim
        val dataType = Option(row.getString(row.fieldIndex("data_type")))
          .getOrElse("").trim
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
}

case class JDBCMetaStore(jdbcUrl: String, spark: SparkSession) extends MetaStore {
  @transient
  private val con = JDBCMetaStore.connect(jdbcUrl)

  private def sql(query: String): DataFrame =
    JDBCMetaStore.executeQuery(query, con, spark)

  override def listPartitions(db: String, table: String, partitionFilter: Option[PartitionFilter] = None): Seq[Partition] = {
    parsePartitionTable(sql(s"show partitions $db.$table"))
      .filter{partValues =>
        partitionFilter.exists(_.filterPartition(partValues))
      }
      .flatMap{partValues =>
        val partSpec = mkPartSpec(partValues)
        val df = sql(s"describe formatted $db.$table partition($partSpec)")
        JDBCMetaStore.parsePartitionDesc(partValues, df)
      }
  }

  override def getTable(db: String, table: String): TableMetadata = {
    JDBCMetaStore.parseTableDesc(sql(s"describe formatted $db.$table"))
  }
}
