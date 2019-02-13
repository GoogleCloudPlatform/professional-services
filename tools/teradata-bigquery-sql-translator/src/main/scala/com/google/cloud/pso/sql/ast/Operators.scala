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

object Operators {
  trait ComparisonOperator extends Operator {
    def op: String
    override def fmt: SQLFmt = keyword(op)
  }

  case object EqualsOperator extends ComparisonOperator {
    override def op: String = "="
  }

  case object NotEqualOperator extends ComparisonOperator {
    override def op: String = "<>"
  }

  case object LessThanOperator extends ComparisonOperator {
    override def op: String = "<"
  }

  case object LessThanOrEqualOperator extends ComparisonOperator {
    override def op: String = "<="
  }

  case object GreaterThanOperator extends ComparisonOperator {
    override def op: String = ">"
  }

  case object GreaterThanOrEqualOperator extends ComparisonOperator {
    override def op: String = ">="
  }

  case object InOperator extends ComparisonOperator {
    override def op: String = "in"
  }

  case object NotInOperator extends ComparisonOperator {
    override def op: String = "not in"
  }
}
