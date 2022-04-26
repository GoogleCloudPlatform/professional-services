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

package com.google.cloud.gszutil.io

import java.nio.{ByteBuffer, CharBuffer}
import java.time.LocalDate

import org.apache.avro.Schema
import org.apache.avro.generic.GenericRecord
import scala.jdk.CollectionConverters.{CollectionHasAsScala}


case class AvroField(field: Schema.Field) {

  // See for avro documentation https://cloud.google.com/bigquery/docs/reference/storage#avro_schema_details
  val isRequired: Boolean = field.schema().getType != Schema.Type.UNION

  val typeSchema: Schema =
    if (isRequired)
      field.schema()
    else {
      import scala.jdk.CollectionConverters.ListHasAsScala
      field.schema().getTypes.asScala
        .filterNot(_.getType == Schema.Type.NULL)
        .toArray.toIndexedSeq.headOption
        .getOrElse(Schema.create(Schema.Type.NULL))
    }

  // buffer for BigInteger values representing Decimal field
  @transient private val decimalBuf = new Array[Byte](16)

  val pos: Int = field.pos()
  def read(row: GenericRecord, sb: CharBuffer): Unit = {
    val v = row.get(pos)
    if (v != null){
      if (isDecimal) {
        val x = AvroUtil.readDecimal(v.asInstanceOf[ByteBuffer], decimalBuf, scale)
        sb.put(x.stripTrailingZeros().toPlainString)
      } else if (isTimestamp) {
        val x = new java.sql.Timestamp(v.asInstanceOf[Long] / 1000L)
        sb.put(AvroUtil.printTimestamp(x))
      } else if (isDate) {
        val x = LocalDate.ofEpochDay(v.asInstanceOf[Int])
        sb.put(AvroUtil.printDate(x))
      } else if (isString) {
        val x = v.asInstanceOf[org.apache.avro.util.Utf8].toString
        AvroUtil.appendQuotedString(',', x, sb)
      } else if (isLong) {
        val x = v.asInstanceOf[Long]
        sb.put(x.toString)
      } else if (isDouble) {
        val x = v.asInstanceOf[Double]
        sb.put(x.toString)
      } else if (isFloat) {
        val x = v.asInstanceOf[Float]
        sb.put(x.toString)
      } else if (isBoolean) {
        val x = v.asInstanceOf[Boolean]
        sb.put(x.toString)
      }else {
        val msg = s"unhandled type ${field.schema()} ${v.getClass.getCanonicalName}"
        throw new RuntimeException(msg)
      }
    } else {
      if (isRequired) {
        val msg = s"missing required field ${field.name()}"
        throw new RuntimeException(msg)
      }
    }
  }

  val isDecimal: Boolean = typeSchema.getType == Schema.Type.BYTES && hasLogicalType(field, "decimal")

  val isBytes: Boolean = typeSchema.getType == Schema.Type.BYTES && isLogicalTypeBlank(field)

  val isTimestamp: Boolean = typeSchema.getType == Schema.Type.LONG && hasLogicalType(field, "timestamp-micros")

  val isTime: Boolean = typeSchema.getType == Schema.Type.LONG && hasLogicalType(field, "time-micros")

  val isDateTime: Boolean = typeSchema.getType == Schema.Type.STRING && hasLogicalType(field, "datetime")

  val isDate: Boolean = typeSchema.getType == Schema.Type.INT && hasLogicalType(field, "date")

  val isString: Boolean = typeSchema.getType == Schema.Type.STRING && isLogicalTypeBlank(field)

  val isLong: Boolean = typeSchema.getType == Schema.Type.LONG && isLogicalTypeBlank(field)

  val isFloat: Boolean = typeSchema.getType == Schema.Type.FLOAT && isLogicalTypeBlank(field)

  val isDouble: Boolean = typeSchema.getType == Schema.Type.DOUBLE && isLogicalTypeBlank(field)

  val isBoolean: Boolean = typeSchema.getType == Schema.Type.BOOLEAN && isLogicalTypeBlank(field)

  val scale: Int = if (isDecimal) typeSchema.getJsonProp("scale").getIntValue else -1

  private def getLogicalType(schema: Schema): String = {
    val schemas = if (schema.getType == Schema.Type.UNION) schema.getTypes.asScala else schema :: Nil
    schemas.flatMap(s => Option(s.getJsonProp("logicalType")).orElse(Option(s.getJsonProp("sqlType"))))
      .map(_.asText()).headOption.getOrElse("")
  }

  private def hasLogicalType(f: Schema.Field, t: String): Boolean = getLogicalType(f.schema()).equalsIgnoreCase(t)

  private def isLogicalTypeBlank(f: Schema.Field): Boolean = getLogicalType(f.schema()).isEmpty
}
