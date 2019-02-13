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

package com.google.cloud.pso.sql

import com.google.cloud.pso.sql.SQLFmt.Fmt
import com.google.cloud.pso.sql.ast.Expressions.ColumnExpression
import com.google.cloud.pso.sql.ast.Identifiers.{ColumnIdent, TableSpec}

package object ast {
  trait SQL {
    private var pos: Int = -1
    def setPos(newpos: Int): SQL.this.type = {
      pos = newpos
      this
    }

    def fmt: SQLFmt
    def print(style: Fmt = Fmt.Default): String = fmt.print(style)
  }

  trait Expression extends SQL {
    def visit: List[Expression] = Nil
    def collectInputs: List[TableSpec] = {
      visit.flatMap{
        case x: Input => x.inputs
        case _ => Nil
      }
    }

    def collectColumns: List[ColumnIdent] = {
      visit.flatMap{
        case x: ColumnExpression => x.column::Nil
        case _ => Nil
      }
    }
  }

  def visitAll(e: List[Expression]): List[Expression] =
    e.flatMap(_.visit)

  trait GroupBy extends Expression
  trait Literal extends SQL
  trait Operator extends SQL
  trait Identifier extends SQL
  trait Join extends SQL
  trait SortOrder extends SQL
  trait SetSpec extends SQL
  trait TypeLiteral extends Literal
  trait Projection extends Expression with OutputColumns
  trait Relation extends Expression with Input
  trait Statement extends Expression with Output with Input with OutputColumns with InputColumns
  trait SelectStatement extends Statement
  trait InsertStatement extends Statement
  trait MergeStatement extends Statement
  trait UpdateStatement extends Statement
  trait CreateTableStatement extends Statement

  trait OutputColumns {
    def columnsWritten: List[ColumnIdent]
  }

  trait InputColumns {
    def columnsRead: List[ColumnIdent]
  }

  trait Output {
    def outputs: List[TableSpec]
  }

  trait Input {
    def inputs: List[TableSpec]
  }
}
