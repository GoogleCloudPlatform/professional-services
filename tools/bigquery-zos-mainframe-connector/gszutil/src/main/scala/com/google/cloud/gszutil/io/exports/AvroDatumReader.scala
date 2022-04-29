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

package com.google.cloud.gszutil.io.exports

import com.google.cloud.bigquery.{FieldList, FieldValueList}
import com.google.cloud.gszutil.io.{AvroField, AvroUtil}
import org.apache.avro.Schema
import org.apache.avro.generic.{GenericDatumReader, GenericRecord}
import org.apache.avro.io.{DatumReader, Decoder}

import java.util
import scala.jdk.CollectionConverters.{IterableHasAsJava, IterableHasAsScala}

class AvroDatumReader(avroSchema: Schema, bqTableSchema: FieldList) extends DatumReader[FieldValueList] {
  private val reader = new GenericDatumReader[GenericRecord](avroSchema)
  private var cachedRecord: GenericRecord = _
  private val avroFields = avroSchema.getFields.asScala.toList.map(f => AvroField(f))

  override def setSchema(schema: Schema): Unit = {
    reader.setSchema(schema)
  }

  override def read(reuse: FieldValueList, in: Decoder): FieldValueList = {
    cachedRecord = reader.read(cachedRecord, in)
    val fields = avroFields.map(f => AvroUtil.toFieldValue(f, cachedRecord.get(f.pos)))
    FieldValueList.of(new util.ArrayList(fields.asJavaCollection), bqTableSchema)
  }
}
