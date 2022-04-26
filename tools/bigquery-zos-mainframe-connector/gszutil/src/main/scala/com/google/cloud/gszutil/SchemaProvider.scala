package com.google.cloud.gszutil

import java.nio.charset.Charset

import com.google.cloud.imf.gzos.Ebcdic
import com.google.cloud.imf.gzos.pb.GRecvProto.Record
import com.google.protobuf.util.JsonFormat
import org.apache.orc.TypeDescription
import org.apache.orc.TypeDescription.Category

trait SchemaProvider extends BinaryEncoding {
  def fieldNames: Seq[String]

  def decoders: Array[Decoder]
  def vartextDecoders: Array[VartextDecoder] = Array.empty

  def toByteArray: Array[Byte]
  def toRecordBuilder: Record.Builder

  def ORCSchema: TypeDescription =
    fieldNames.zip(decoders.filterNot(_.filler))
      .foldLeft(new TypeDescription(Category.STRUCT)){(a,b) =>
          a.addField(b._1,b._2.typeDescription)
      }

  def vartext: Boolean = false

  def delimiter: Array[Byte]

  def srcCharset: Charset = Ebcdic.charset

  def LRECL: Int = decoders.foldLeft(0){_ + _.size}

  override def toString: String = JsonFormat.printer()
    .includingDefaultValueFields()
    .print(toRecordBuilder)
}
