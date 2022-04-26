/*
 * Copyright 2019 Google LLC All Rights Reserved.
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

package com.google.cloud.gszutil

import java.nio.charset.Charset

import com.google.cloud.gszutil.Decoding.{CopyBookField, CopyBookLine}
import com.google.cloud.imf.gzos.Ebcdic
import com.google.cloud.imf.gzos.pb.GRecvProto.Record

import scala.collection.mutable.ArrayBuffer


case class CopyBook(raw: String,
                    transcoder: Transcoder = Ebcdic,
                    altFields: Option[Seq[CopyBookLine]] = None,
                    picTCharset: Option[String] = None) extends SchemaProvider {

  final val Fields: Seq[CopyBookLine] = altFields match {
    case Some(fl) => fl
    case None => raw.linesIterator.flatMap(Decoding.parseCopyBookLine(_, transcoder, picTCharset)).toSeq
  }

  override def fieldNames: Seq[String] =
    altFields.getOrElse(Fields).flatMap {
      case CopyBookField(name, decoder, _) if !decoder.filler =>
        Option(name.replaceAllLiterally("-", "_"))
      case _ =>
        None
    }

  override lazy val decoders: Array[Decoder] = {
    val buf = ArrayBuffer.empty[Decoder]
    altFields.getOrElse(Fields).foreach {
      case CopyBookField(_, decoder, _) =>
        buf.append(decoder)
      case _ =>
    }
    buf.toArray
  }

  override def srcCharset: Charset = transcoder.charset

  override def delimiter: Array[Byte] = Array.emptyByteArray

  override def toString: String =
    s"LRECL=$LRECL\nFIELDS=${fieldNames.mkString(",")}\n$raw\n\nORC TypeDescription:\n${ORCSchema.toJson}"

  override def toByteArray: Array[Byte] =
    toRecordBuilder.build().toByteArray

  override def toRecordBuilder: Record.Builder = {
    val b = Record.newBuilder()
      .setSource(Record.Source.COPYBOOK)
      .setOriginal(raw)

    Fields.foreach {
      case CopyBookField(name, decoder, _) =>
        b.addField(decoder.toFieldBuilder.setName(name))
      case _ =>
    }

    b
  }

  override def encoders: Array[BinaryEncoder] = {
    if (vartext) {
      throw new RuntimeException("Vartext export not supported.")
    } else {
      Fields.flatMap {
        case CopyBookField(name, decoder, typ) => Option(Encoding.getEncoder(CopyBookField(name, decoder, typ), transcoder, picTCharset))
        case _ => None
      }
    }.toArray
  }
}

