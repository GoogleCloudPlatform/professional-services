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
import com.google.cloud.pso.sql.SQLFmt._
import com.google.cloud.pso.sql.ast.Identifiers.{ColumnIdent, TableSpec}

object Projections {
  case class AllColumnsExcept(col: String) extends Projection {
    override def visit: List[Expression] = this :: Nil
    override def fmt: SQLFmt =
      keyword("*") ~- keyword("except") ~- ident(col)

    override def columnsWritten: List[ColumnIdent] = ColumnIdent("*") :: Nil
  }

  case object AllColumns extends Projection {
    override def visit: List[Expression] = this :: Nil
    override def fmt: SQLFmt = "*"
    override def columnsWritten: List[ColumnIdent] = ColumnIdent("*") :: Nil
  }

  case class AllTableColumns(table: TableSpec) extends Projection {
    override def visit: List[Expression] = this :: Nil
    override def fmt: SQLFmt = table.fmt ~ ".*"
    override def columnsWritten: List[ColumnIdent] = ColumnIdent("*", Option(table)) :: Nil
  }

  case class ExpressionProjection(expression: Expression,
                                  alias: Option[String] = None)
    extends Projection {
    override def visit: List[Expression] = this :: Nil ++ expression.visit
    override def fmt: SQLFmt =
      expression.fmt ~- alias.map(a => keyword("as") ~- ident(a))

    override def columnsWritten: List[ColumnIdent] = collectColumns
  }

}
