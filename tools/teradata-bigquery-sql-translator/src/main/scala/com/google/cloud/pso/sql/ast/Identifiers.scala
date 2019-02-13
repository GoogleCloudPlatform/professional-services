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
import com.google.cloud.pso.sql.SQLFmt.ident

object Identifiers {

  /** Identifies a BigQuery table
    *
    * @param table required table name
    * @param dataset optional equivalent to schema in other dialects
    * @param project optional specification of project
    */
  case class TableSpec(table: String, dataset: Option[String] = None, project: Option[String] = None) extends Identifier {
    override def fmt: SQLFmt = (dataset, project) match {
      case (Some(s), Some(d)) => ident(d) ~ "." ~ ident(s) ~ "." ~ ident(table)
      case (Some(s), None) => ident(s) ~ "." ~ ident(table)
      case _ => ident(table)
    }

    override def toString: String = s"""TableSpec("$table", $dataset, $project)"""

    override def equals(obj: Any): Boolean = obj match {
      case o: TableSpec =>
        table.toLowerCase == o.table.toLowerCase && dataset.map(_.toLowerCase) == o.dataset.map(_.toLowerCase) && project.map(_.toLowerCase) == o.project.map(_.toLowerCase)
      case _ => false
    }
  }

  /** Identifies a column in a BigQuery table
    *
    * @param name required name of column
    * @param table optional table identifier
    */
  case class ColumnIdent(name: String, table: Option[TableSpec] = None, alias: Option[String] = None) extends Identifier {
    override def fmt: SQLFmt = table match {
      case Some(t) => t.fmt ~ "." ~ ident(name)
      case _ => ident(name)
    }

    override def equals(o: Any): Boolean = o match {
      case x: ColumnIdent =>
        name == x.name && table == x.table
      case _ => false
    }

    override def toString: String = s"""ColumnIdent("$name"${table.map(x => s""", "$x"""")})"""
  }
}
