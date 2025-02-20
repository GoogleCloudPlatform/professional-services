//      Copyright 2025 Google LLC
//
//      Licensed under the Apache License, Version 2.0 (the "License");
//      you may not use this file except in compliance with the License.
//      You may obtain a copy of the License at
//
//          http://www.apache.org/licenses/LICENSE-2.0
//
//      Unless required by applicable law or agreed to in writing, software
//      distributed under the License is distributed on an "AS IS" BASIS,
//      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//      See the License for the specific language governing permissions and
//      limitations under the License.


import com.google.cloud.spanner.{DatabaseClient, Mutation, SpannerOptions, Value}
import org.apache.spark.sql.{DataFrame, Row}
import java.sql.{Date => SqlDate, Timestamp => SqlTimestamp}
import com.google.cloud.{Date => CloudDate, Timestamp => CloudTimestamp}
import scala.collection.mutable.ArrayBuffer
import scala.collection.JavaConverters._  // Import JavaConverters

class SpannerMutations(
    prj: String,
    inst: String,
    db: String,
    tbl: String
) extends Serializable {

  private def createSpannerClient(): DatabaseClient = {
    val options = SpannerOptions.newBuilder().build()
    val spanner = options.getService()
    spanner.getDatabaseClient(
      com.google.cloud.spanner.DatabaseId.of(prj, inst, db)
    )
  }

  // Helper function to do conversion of data types
  private def convertSqlDateToCloudDate(sqlDate: SqlDate): CloudDate = {
    val localDate = sqlDate.toLocalDate
    CloudDate.fromYearMonthDay(
      localDate.getYear,
      localDate.getMonthValue,
      localDate.getDayOfMonth
    )
  }
  private def convertSqlTimestampToCloudTimestamp(
      SqlTimestamp: SqlTimestamp
  ): CloudTimestamp = {
    CloudTimestamp.of(SqlTimestamp)
  }

  // Function to extract BigDecimal values (with null handling)
  private def convertBigDecimalToSpannerFloat(
      row: Row,
      columnName: String
  ): Option[Double] = {
    Option(row.getAs[java.math.BigDecimal](columnName)).map(_.doubleValue())
  }

  // Generic function to extract values (with null handling)
  private def getValue[T](row: Row, columnName: String)(implicit
      evidence: Manifest[T]
  ): Option[T] = {
    Option(row.getAs[T](columnName))
  }

    
  // Function to build mutation dynamically
  private def buildMutation(
      row: Row,
      schema: org.apache.spark.sql.types.StructType, 
      tbl: String
  ): Mutation = {
    val builder = Mutation.newInsertOrUpdateBuilder(s"$tbl")

    schema.fields.foreach { field =>
      val columnName = field.name
      val columnType = field.dataType

      val spannerValue: Value =
        columnType match { // Specify Value as the return type
          case org.apache.spark.sql.types.StringType =>
            Value.string(getValue[String](row, columnName).getOrElse(""))
          case org.apache.spark.sql.types.LongType =>
            Value.int64(getValue[Long](row, columnName).getOrElse(0L))
          case org.apache.spark.sql.types.TimestampType =>
            Value.timestamp(
              convertSqlTimestampToCloudTimestamp(
                row.getAs[SqlTimestamp](columnName)
              )
            )
          case org.apache.spark.sql.types.DateType =>
            Value.date(
              convertSqlDateToCloudDate(row.getAs[SqlDate](columnName))
            )
          case org.apache.spark.sql.types.DecimalType() =>
            Value.float64(
              convertBigDecimalToSpannerFloat(row, columnName).getOrElse(0.0)
            )
          // Add other data type conversions as needed
          case _ =>
            throw new IllegalArgumentException(
              s"Unsupported data type: ${columnType}"
            )
        }

      builder.set(columnName).to(spannerValue) // Use the Spanner Value
    }

    builder.build()
  }

  def write(df: DataFrame): Unit = {
    val schema = df.schema

    val maxMutationSizeInBytes = 100 * 1024 * 1024 // 100MB
    val maxMutationsPerTransaction = 80000 // Spanner's limit, adjust if needed


    // Estimate average row size in bytes (this is a simplified estimation)
    val estimatedRowSizeInBytes = df.schema.fields.map { field =>
      field.dataType match {
        case org.apache.spark.sql.types.StringType =>
          256 // Assume average string length
        case org.apache.spark.sql.types.LongType      => 8
        case org.apache.spark.sql.types.TimestampType => 8
        case org.apache.spark.sql.types.DateType      => 4
        case org.apache.spark.sql.types.DecimalType() => 8
        // Add estimations for other data types
        case _ => 256 // Default to a larger size for unknown types
      }
    }.sum

    // First: Calculate batch size
    val batchSize = Math
      .min(
        maxMutationSizeInBytes / estimatedRowSizeInBytes, // Limit by mutation size
        maxMutationsPerTransaction
      )
      .toInt
      
    // Second: Calculate dynamic batch size based on number of columns
    val numColumns = df.schema.fields.length
    val batchSize_cal = Math.max(80000 / numColumns, 1) // Adjust divisor as needed

    // Choose best out of these two
    val spanner_batch_size = Math.min(batchSize, batchSize_cal).toInt

    df.rdd.foreachPartition { partition =>
      val client = createSpannerClient()
      val mutations = ArrayBuffer.empty[Mutation]
      var mutationsInTransaction = 0

      partition.foreach { row =>
        mutations += buildMutation(row, schema, tbl)
        mutationsInTransaction += 1

        if (mutationsInTransaction >= spanner_batch_size) {
          client.write(mutations.asJava)
          mutations.clear()
          mutationsInTransaction = 0
        }
      }

      if (mutations.nonEmpty) {
        client.write(mutations.asJava)
      }
    }
  }
}
