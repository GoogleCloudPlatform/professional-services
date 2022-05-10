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

package com.google.cloud.bqsh

import com.google.cloud.imf.gzos.MVSStorage.{DSN, MVSDataset}

case class JCLUtilConfig(src: String = "",
                         dest: String = "",
                         transform: String = "",
                         expressions: Seq[String] = Seq.empty,
                         filter: String = "^TD.*$",
                         limit: Int = 4096,
                         printSteps: Boolean = false) {
  def srcDSN: DSN = MVSDataset(src)
  def destDSN: DSN = MVSDataset(dest)

  def exprs: Seq[(String,String)] = expressions.flatMap(parseExpr)

  def parseExpr(s: String): Option[(String,String)] = {
    if (s.length >= 5 && s.charAt(0) == 's') {
      val a = s.split(s.charAt(1))
      if (a.length == 3) Option((a(1),a(2)))
      else None
    } else None
  }
}
