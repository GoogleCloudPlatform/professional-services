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
