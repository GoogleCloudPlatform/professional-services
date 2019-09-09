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

import com.google.cloud.gszutil.Decoding.{CopyBookField, CopyBookLine, Decoder, parseCopyBookLine}
import org.apache.orc.TypeDescription
import org.apache.orc.TypeDescription.Category

import scala.collection.mutable.ArrayBuffer


case class CopyBook(raw: String) {
  final val Fields: Seq[CopyBookLine] = raw.lines.flatMap(parseCopyBookLine).toSeq

  final val FieldNames: Seq[String] =
    Fields.flatMap{
      case CopyBookField(name, _) =>
        Option(name.replaceAllLiterally("-","_"))
      case _ =>
        None
    }

  final val decoders: Array[Decoder] = {
    val buf = ArrayBuffer.empty[Decoder]
    Fields.foreach{
      case CopyBookField(_, decoder) =>
        buf.append(decoder)
      case _ =>
    }
    buf.toArray
  }

  final val ORCSchema: TypeDescription = {
    val schema = new TypeDescription(Category.STRUCT)
    FieldNames
      .zip(decoders)
      .foreach{f =>
        schema.addField(f._1, f._2.typeDescription)
      }
    schema
  }

  final val LRECL: Int = decoders.foldLeft(0){_ + _.size}

  override def toString: String =
    s"LRECL=$LRECL\nFIELDS=${FieldNames.mkString(",")}\n$raw\n\nORC TypeDescription:\n${ORCSchema.toJson}"
}

