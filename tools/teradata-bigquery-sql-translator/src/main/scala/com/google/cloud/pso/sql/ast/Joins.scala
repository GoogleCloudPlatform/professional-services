/*
 * Copyright 2019 Google LLC
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

package com.google.cloud.pso.sql.ast

import com.google.cloud.pso.sql.SQLFmt
import com.google.cloud.pso.sql.SQLFmt.keyword

object Joins {
  case object InnerJoin extends Join {
    override def fmt: SQLFmt = keyword("join")
  }

  case object LeftJoin extends Join {
    override def fmt: SQLFmt = keyword("left") ~- keyword("join")
  }

  case object RightJoin extends Join {
    override def fmt: SQLFmt = keyword("right") ~- keyword("join")
  }

  case object FullJoin extends Join {
    override def fmt: SQLFmt = keyword("full") ~- keyword("join")
  }

  case object CrossJoin extends Join {
    override def fmt: SQLFmt = keyword("cross") ~- keyword("join")
  }
}
