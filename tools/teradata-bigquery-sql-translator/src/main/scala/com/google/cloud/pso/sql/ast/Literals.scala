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

import com.google.cloud.pso.sql.SQLFmt._
import com.google.cloud.pso.sql._

object Literals {
  sealed trait BooleanLiteral extends Literal

  case class IntegerLiteral(value: Long) extends Literal {
    override def fmt: SQLFmt = value.toString
  }

  case class DecimalLiteral(value: Double) extends Literal {
    override def fmt: SQLFmt = value.toString
  }

  case class StringLiteral(value: String) extends Literal {
    override def fmt: SQLFmt =
      s"""'${value.toString.replace("'", "''")}'"""
  }

  case object NullLiteral extends Literal {
    override def fmt: SQLFmt = keyword("null")
  }

  case object TrueLiteral extends BooleanLiteral {
    override def fmt: SQLFmt = keyword("true")
  }

  case object FalseLiteral extends BooleanLiteral {
    override def fmt: SQLFmt = keyword("false")
  }

  case object UnknownLiteral extends BooleanLiteral {
    override def fmt: SQLFmt = keyword("unknown")
  }

  case object IntegerTypeLiteral extends TypeLiteral {
    override def fmt: SQLFmt = keyword("integer")
  }

  case class VarcharTypeLiteral(length: Option[Long] = None) extends TypeLiteral {
    override def fmt: SQLFmt = keyword("string")
  }

  case object NumericTypeLiteral extends TypeLiteral {
    override def fmt: SQLFmt = keyword("numeric")
  }

  case object FloatTypeLiteral extends TypeLiteral {
    override def fmt: SQLFmt = keyword("float")
  }

  case object DecimalTypeLiteral extends TypeLiteral {
    override def fmt: SQLFmt = keyword("float")
  }

  case class TimestampTypeLiteral(n: Option[Long] = None) extends TypeLiteral {
    override def fmt: SQLFmt = keyword("timestamp") ~ "()"
  }

  // YYYY-MM-DD is the only format supported by BigQuery
  case class DateTypeLiteral(format: Option[String] = None) extends TypeLiteral {
    override def fmt: SQLFmt = keyword("date")
  }

  case object BooleanTypeLiteral extends TypeLiteral {
    override def fmt: SQLFmt = keyword("boolean")
  }
}
