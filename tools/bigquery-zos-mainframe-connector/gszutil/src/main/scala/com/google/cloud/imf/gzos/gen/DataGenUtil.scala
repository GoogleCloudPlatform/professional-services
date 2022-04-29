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

package com.google.cloud.imf.gzos.gen

import java.nio.charset.Charset

import com.google.cloud.gszutil.SchemaProvider
import com.google.cloud.imf.gzos.Ebcdic
import com.google.cloud.imf.gzos.pb.GRecvProto.Record
import com.google.cloud.imf.gzos.pb.GRecvProto.Record.Field.FieldType

object DataGenUtil {
  def generatorFor(sp: SchemaProvider, n: Int = 20000): DataGenerator = {
    new DataGenerator(sp, n, Ebcdic.charset)
  }

  def getGenerator(f: Record.Field, charset: Charset): ValueGenerator = {
    f.getTyp match {
      case FieldType.DECIMAL =>
        new DecimalGenerator(f)
      case FieldType.INTEGER =>
        new IntegerGenerator(f)
      case FieldType.DATE =>
        new IntDateGenerator(f)
      case FieldType.BYTES => new ByteGenerator(f)
      case FieldType.STRING | FieldType.LATIN_STRING =>
        if (f.getCast == FieldType.DATE)
          new DateGenerator(f, charset)
        else
          new StringGenerator(f, charset)
      case x =>
        throw new RuntimeException(s"unable to generate data for $x")
    }
  }
}
