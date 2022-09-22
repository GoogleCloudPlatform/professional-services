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

package com.google.cloud.imf.gzos

object MVSStorage {
  sealed trait DSN {
    def fqdsn: String
    override def toString: String = fqdsn
  }

  case class MVSDataset(dsn: String) extends DSN {
    override val fqdsn: String = s"//'$dsn'"
  }

  case class MVSPDSMember(pdsDsn: String, member: String) extends DSN {
    override val fqdsn: String = s"//'$pdsDsn($member)'"
  }

  def parseDSN(dsn: String): DSN = {
    val s = dsn.stripPrefix("//").stripPrefix("'").stripSuffix("'")
    val i = s.indexOf("(")
    val j = s.indexOf(")")
    if (i > 0 && j > i){
     MVSPDSMember(s.substring(0,i),s.substring(i+1,j))
    } else MVSDataset(s)
  }
}
