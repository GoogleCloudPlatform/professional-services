package com.google.cloud.gszutil

import java.nio.charset.Charset

import com.google.cloud.imf.gzos.Ebcdic
import com.google.cloud.imf.gzos.pb.GRecvProto.Record
import com.google.cloud.imf.gzos.pb.GRecvProto.Record.Field

case class RecordSchema(r: Record) extends SchemaProvider {
  require(r.getFieldCount > 0, "record must have at least 1 field")
  import scala.jdk.CollectionConverters.ListHasAsScala
  private def fields: Array[Field] = r.getFieldList.asScala.toArray

  def fieldTypes: Seq[Field.FieldType] = fields.toIndexedSeq.filterNot(_.getFiller).map(_.getTyp)
  override def fieldNames: Seq[String] = fields.toIndexedSeq.filterNot(_.getFiller).map(_.getName)
  override lazy val decoders: Array[Decoder] =
    if (r.getVartext)
      fields.map(VartextDecoding.getVartextDecoder(_, transcoder))
    else
      fields.map(Decoding.getDecoder(_, transcoder))

  override def vartextDecoders: Array[VartextDecoder] = {
    if (vartext) decoders.flatMap{
      case x: VartextDecoder => Some(x)
      case _ => None
    }
    else throw new RuntimeException("record is not stored as vartext")
  }

  private def transcoder: Transcoder =
    if (r.getEncoding == "" || r.getEncoding.equalsIgnoreCase("EBCDIC"))
      Ebcdic
    else Utf8

  override def toByteArray: Array[Byte] = r.toByteArray
  override def toRecordBuilder: Record.Builder = r.toBuilder
  override def LRECL: Int = decoders.foldLeft(0){_ + _.size}

  override def vartext: Boolean = r.getVartext
  override def delimiter: Array[Byte] = r.getDelimiter.toByteArray
  override def srcCharset: Charset = transcoder.charset

  override def encoders: Array[BinaryEncoder] = {
    if (vartext) {
      throw new RuntimeException("Vartext export not supported.")
    } else {
      fields.map(Encoding.getEncoder(_, transcoder))
    }
  }
}

