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

package com.google.cloud.pso

import org.apache.spark.sql.jdbc.{JdbcDialect, JdbcType}
import org.apache.spark.sql.types._

object SpannerJdbcDialect extends JdbcDialect {

  /*
  JdbcDialect is an abstract class
  We need to override methods of this abstract class
   */

  /*
  Checks if this dialect instance can handle a certain jdbc url.
  We override this to indicate that this dialect can handle Spanner specific jdbc urls.
   */
  override def canHandle(url: String): Boolean =
    url.toLowerCase.startsWith("jdbc:cloudspanner:")

  /*
  When reading from Spanner w/ JDBC need to map Spanner GoogleSQL type to SparkSQL type.
  Default behaviour, JdbcUtils.getCatalystType maps JDBC type to Spark Catalyst type.
  We overwrite this type mapping to make it work for Spanner
   */
  override def getCatalystType(
      sqlType: Int,
      typeName: String,
      size: Int,
      md: MetadataBuilder
  ): Option[DataType] =
    if (sqlType == java.sql.Types.NUMERIC) Some(DecimalType(38, 9)) else None

  /*
  When writing to Spanner w/ JDBC need to map SparkSQL type to Spanner GoogleSQL type.
  Default behaviour, org.apache.spark.jdbc.JdbcUtils ==> getCommonJDBCType
  We override this to make sure all data types for writing are supported by Spanner.
   */
  override def getJDBCType(dt: DataType): Option[JdbcType] = dt match {
    case IntegerType   => Some(JdbcType("INT64", java.sql.Types.INTEGER))
    case LongType      => Some(JdbcType("INT64", java.sql.Types.BIGINT))
    case DoubleType    => Some(JdbcType("FLOAT64", java.sql.Types.DOUBLE))
    case FloatType     => Some(JdbcType("FLOAT64", java.sql.Types.FLOAT))
    case ShortType     => Some(JdbcType("INT64", java.sql.Types.SMALLINT))
    case ByteType      => Some(JdbcType("BYTES(1)", java.sql.Types.TINYINT))
    case BooleanType   => Some(JdbcType("BOOL", java.sql.Types.BOOLEAN))
    case StringType    => Some(JdbcType("STRING(MAX)", java.sql.Types.VARCHAR))
    case BinaryType    => Some(JdbcType("BYTES(MAX)", java.sql.Types.VARBINARY))
    case TimestampType => Some(JdbcType("TIMESTAMP", java.sql.Types.TIMESTAMP))
    case DateType      => Some(JdbcType("DATE", java.sql.Types.DATE))
    case _: DecimalType => Some(JdbcType("NUMERIC", java.sql.Types.NUMERIC))
    case _              => None
  }

  /*
  Change default behaviour around quoting identifiers.
  This is used to put quotes around the identifier in case the column name.
  We override this default behaviour to make it compatible with Spanner.
   */
  override def quoteIdentifier(colName: String): String = s"`$colName`"

}
