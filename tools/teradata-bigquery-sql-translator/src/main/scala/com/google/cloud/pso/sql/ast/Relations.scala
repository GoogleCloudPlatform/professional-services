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
import com.google.cloud.pso.sql.ast.Identifiers.TableSpec

object Relations {
  case class InsertRelation(table: TableSpec, alias: Option[String] = None) extends Expression with Output {
    override def outputs: List[TableSpec] = table :: Nil
    override def visit: List[Expression] = this :: Nil
    override def fmt: SQLFmt = table.fmt ~- alias.map(ident)
  }

  case class SingleTableRelation(table: TableSpec, alias: Option[String] = None) extends Relation {
    override def inputs: List[TableSpec] = table :: Nil
    override def fmt: SQLFmt =
      table.fmt ~- alias.map(a => keyword("as") ~- ident(a))

    override def visit: List[Expression] = this :: Nil
    override def hashCode(): Int = table.hashCode()
  }

  case class SubSelectRelation(select: SelectStatement, alias: String) extends Relation {
    override def inputs: List[TableSpec] = select.inputs
    override def visit: List[Expression] = select.visit
    override def fmt: SQLFmt =
      "(" ~| select.fmt ~ ")" ~- keyword("as") ~- ident(alias)
  }

  case class JoinRelation(left: Relation, join: Join, right: Relation, on: Option[Expression] = None) extends Relation {
    override def inputs: List[TableSpec] = left.inputs ++ right.inputs
    override def fmt: SQLFmt =
      left.fmt ~/
      join.fmt ~- right.fmt ~|
        on.map(e => keyword("on") ~- e.fmt)

    override def visit: List[Expression] = left.visit ++ right.visit ++ on.map(_.visit).getOrElse(Nil)
  }

}
