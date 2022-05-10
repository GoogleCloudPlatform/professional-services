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

package com.google.cloud.gszutil

trait NullableDecoder extends Decoder {
  protected def nullIf: Array[Byte]

  // check for null condition
  protected def isNull(bytes: Array[Byte], i: Int, nullIf: Array[Byte]): Boolean = {
    if (size < nullIf.length || nullIf.isEmpty)
      return false

    var j = 0
    while (j < nullIf.length){
      if (bytes(i+j) != nullIf(j))
        return false
      j += 1
    }
    true
  }
}
