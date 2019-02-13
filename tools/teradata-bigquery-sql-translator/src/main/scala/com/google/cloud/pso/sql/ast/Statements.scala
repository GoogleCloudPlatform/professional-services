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
import com.google.cloud.pso.sql.ast.Expressions._
import com.google.cloud.pso.sql.ast.Identifiers.{ColumnIdent, TableSpec}
import com.google.cloud.pso.sql.ast.Literals.{IntegerLiteral, TrueLiteral}
import com.google.cloud.pso.sql.ast.Projections.{AllColumnsExcept, ExpressionProjection}
import com.google.cloud.pso.sql.ast.Relations._

object Statements {

  /** BigQuery Standard SQL requires where clause on Update statements */
  def rewriteUpdate(update: Update): Update = {
    if (update.where.isEmpty) {
      val whereTrue: Option[Expression] = Option(LiteralExpression(TrueLiteral))
      update.copy(where = whereTrue)
    } else update
  }

  case class Update(update: InsertRelation,
                    from: List[Relation] = Nil,
                    set: List[Expression] = Nil,
                    where: Option[Expression] = None) extends UpdateStatement {

    override def visit: List[Expression] =
      from.flatMap(_.visit) ++ set.flatMap(_.visit) ++ where.map(_.visit).getOrElse(Nil)

    override def inputs: List[TableSpec] =
      from.flatMap(_.collectInputs) ++ set.flatMap(_.collectInputs) ++ where.map(_.collectInputs).getOrElse(Nil)

    override def outputs: List[TableSpec] = update.outputs

    override def fmt: SQLFmt = {
      if (where.isEmpty) {
        rewriteUpdate(this).fmt
      } else {
        val actualTarget: InsertRelation =
          from.flatMap{
            case x: SingleTableRelation => Option(x)
            case _ => None
          }.find(_.alias.contains(update.table.table))
            .map(x => InsertRelation(x.table))
            .getOrElse(update)
        val fromTables: List[Relation] =
          from.flatMap {
            case x: SingleTableRelation if x.alias.contains(update.table.table) => None
            case y => Option(y)
          }

        keyword("update") ~|
        actualTarget.fmt ~
        fmtAll(fromTables).map { relations =>
          keyword("from") ~|
            join(relations)
        } ~
        fmtAll(set).map { exprs =>
          keyword("set") ~|
            join(exprs)
        } ~
        where.map { e =>
          keyword("where") ~|
            e.fmt
        }
      }
    }

    override def columnsRead: List[ColumnIdent] = {
      set.flatMap(_.visit).flatMap{
        case x: ComparisonExpression =>
          x.right.collectColumns
        case _ => Nil
      } ++ where.map(_.collectColumns).getOrElse(Nil)
    }

    override def columnsWritten: List[ColumnIdent] =
      set.flatMap(_.visit).flatMap{
        case x: ComparisonExpression =>
          x.left.collectColumns
        case _ => Nil
      }
  }

  case class SelectUnion(left: SelectStatement, distinct: Option[SetSpec], right: SelectStatement) extends SelectStatement {
    override def visit: List[Expression] =
      left.visit.flatMap(_.visit) ++ right.visit.flatMap(_.visit)

    override def fmt: SQLFmt =
      left.fmt ~/
      keyword("union") ~-
      distinct.map(_.fmt) ~/
      right.fmt

    override def outputs: List[TableSpec] = left.outputs ++ right.outputs

    override def inputs: List[TableSpec] = left.inputs ++ right.inputs

    override def columnsRead: List[ColumnIdent] = left.columnsRead ++ right.columnsRead

    override def columnsWritten: List[ColumnIdent] = left.columnsWritten ++ right.columnsWritten
  }

  def rewriteSelect(s: Select): Select = {
    if (s.qualify.isDefined) {
      val q = s.qualify.get
      val qcol = "qcol"
      val qalias = "q"

      val qualifyExpr = ComparisonExpression(q.comparisonOperator.op, ColumnExpression(ColumnIdent(qcol)), q.comparisonExpression)

      val newColumn: Projection = ExpressionProjection(q.partitionExpression, Option(qcol))
      val newColumns: List[Projection] = s.projections ++ List(newColumn)
      val subquery: SelectStatement = s.copy(qualify = None, projections = newColumns)

      Select(
        projections = List(AllColumnsExcept(qcol)),
        relations = List(SubSelectRelation(subquery, qalias)),
        where = Option(qualifyExpr)
      )
    } else {
      s
    }
  }

  case class CreateTable(table: SingleTableRelation, columns: List[(ColumnIdent,TypeLiteral)], partitionBy: Option[ColumnIdent] = None, clusterBy: List[ColumnIdent] = Nil) extends CreateTableStatement {
    override def fmt: SQLFmt = {
      keyword("create") ~-
      keyword("table") ~-
      table.fmt ~
      values1(columns.map { x => x._1.fmt ~- x._2.fmt }) ~/
      partitionBy.map(x => keyword("partition by") ~- x.fmt) ~/
      Option(clusterBy).filter(_.nonEmpty).map { x =>
        keyword("cluster by") ~- join(x.map(_.fmt), ",")
      }
    }
    override def columnsWritten: List[ColumnIdent] = Nil
    override def outputs: List[TableSpec] = table.table::Nil
    override def inputs: List[TableSpec] = Nil
    override def columnsRead: List[ColumnIdent] = Nil
  }

  case class CreateTableAsSelect(table: SingleTableRelation, select: SelectStatement, indexColumns: List[ColumnIdent] = Nil) extends CreateTableStatement {
    override def fmt: SQLFmt = {
      keyword("create") ~-
      keyword("table") ~-
      table.fmt ~-
      keyword("as") ~-
      paren1(select.fmt)
    }

    override def outputs: List[TableSpec] = table.table :: select.outputs

    override def inputs: List[TableSpec] = select.inputs

    override def columnsWritten: List[ColumnIdent] = select.columnsRead.map(_.copy(table = Option(table.table)))

    override def columnsRead: List[ColumnIdent] = select.columnsRead
  }

  case class Select(
                           distinct: Option[SetSpec] = None,
                           projections: List[Projection] = Nil,
                           relations: List[Relation] = Nil,
                           where: Option[Expression] = None,
                           groupBy: List[GroupBy] = Nil,
                           having: Option[Expression] = None,
                           orderBy: List[SortExpression] = Nil,
                           qualify: Option[QualifyExpression] = None,
                           limit: Option[IntegerLiteral] = None) extends SelectStatement {


    override def visit: List[Expression] = {
      projections.flatMap(_.visit) ++
      relations.flatMap(_.visit) ++
      where.map(_.visit).getOrElse(Nil) ++
      groupBy.flatMap(_.visit) ++
      having.map(_.visit).getOrElse(Nil) ++
      orderBy.flatMap(_.visit) ++
      qualify.map(_.visit).getOrElse(Nil)
    }

    override def outputs: List[TableSpec] = Nil

    override def inputs: List[TableSpec] = collectInputs

    override def fmt: SQLFmt = {
      if (qualify.isDefined) {
        rewriteSelect(this).fmt
      } else {
        keyword("select") ~-
        distinct.map(_.fmt) ~|
        join(projections.map(_.fmt)) ~/
        fmtAll(relations).map { relations =>
          keyword("from") ~|
            join(relations)
        } ~/
        where.map { e =>
          keyword("where") ~|
            e.fmt
        } ~/
        fmtAll(groupBy).map { groups =>
          keyword("group") ~-
            keyword("by") ~|
            join(groups)
        } ~/
        having.map { e =>
          keyword("having") ~|
            e.fmt
        } ~/
        fmtAll(orderBy).map { expressions =>
          keyword("order") ~-
            keyword("by") ~|
            join(expressions)
        } ~/
        limit.map { e =>
          keyword("limit") ~-
            e.fmt
        }
      }
    }

    override def columnsRead: List[ColumnIdent] = {
      (projections.flatMap(_.collectColumns) ++
        relations.flatMap(_.collectColumns) ++
        qualify.map(_.collectColumns).getOrElse(Nil) ++
        where.map(_.collectColumns).getOrElse(Nil) ++
        groupBy.flatMap(_.collectColumns) ++
        having.map(_.collectColumns).getOrElse(Nil) ++
        orderBy.flatMap(_.collectColumns)).distinct
    }

    override def columnsWritten: List[ColumnIdent] = projections.flatMap(_.columnsWritten)
  }

  case class Insert(targetTable: InsertRelation,
                    columns: List[ColumnIdent],
                    select: SelectStatement) extends InsertStatement {
    override def visit: List[Expression] = select.visit
    override def outputs: List[TableSpec] = targetTable.outputs
    override def inputs: List[TableSpec] = collectInputs

    override def columnsRead: List[ColumnIdent] = select.columnsRead
    override def columnsWritten: List[ColumnIdent] = {
      val read = columnsRead
      if (read.exists(_.name == "*"))
        (read ++ columnsRead).distinct
      else columns
    }
    override def fmt: SQLFmt = {
      keyword("insert") ~- keyword("into") ~-
      targetTable.fmt ~-
      fmtAll(columns).map { cols =>
        paren1(join(cols))
      } ~/
      select.fmt
    }
  }

  case class Merge(insert: InsertRelation,
                   relation: Expression,
                   on: Expression,
                   when: List[MergeWhenClause]) extends MergeStatement {
    override def fmt: SQLFmt = {
      val a = {
        keyword("merge") ~- keyword("into") ~- insert.fmt ~/
        keyword("using") ~- relation.fmt ~|
        keyword("on") ~| on.fmt
      }
      when.foldLeft[SQLFmt](a){(l,r) => l ~/ r.fmt}
    }


    override def columnsWritten: List[ColumnIdent] = Nil

    override def columnsRead: List[ColumnIdent] = Nil

    override def inputs: List[TableSpec] = Nil

    override def outputs: List[TableSpec] = Nil
  }

  trait MergeWhenClause extends Expression
  case class MergeMatchedClause(a: Option[Expression], b: MergeUpdateOrDelete) extends MergeWhenClause {
    override def fmt: SQLFmt =
      keyword("when") ~- keyword("matched") ~-
      a.map{x => keyword("and") ~- x.fmt} ~-
      keyword("then") ~- keyword("update") ~- b.fmt
  }
  case class MergeNotMatchedByTargetClause(a: Option[Expression], insert: MergeInsertClause) extends MergeWhenClause {
    override def fmt: SQLFmt =
      keyword("when not matched by target") ~-
      a.map{x => keyword("and") ~- x.fmt} ~-
      keyword("then") ~- insert.fmt
  }
  case class MergeNotMatchedBySourceClause(a: Option[Expression], b: MergeUpdateOrDelete) extends MergeWhenClause {
    override def fmt: SQLFmt =
      keyword("when not matched by source") ~-
      a.map{x => keyword("and") ~- x.fmt} ~-
      keyword("then") ~- b.fmt
  }
  case class MergeInsertClause(cols: Option[List[ColumnIdent]], vals: List[Expression]) extends Expression {
    override def fmt: SQLFmt =
      keyword("insert") ~-
      cols.map(values) ~-
      keyword("values") ~-
      values(vals)
  }

  trait MergeUpdateOrDelete extends Expression
  case class MergeUpdateClause(updateItems: List[(ColumnExpression,Expression)]) extends MergeUpdateOrDelete {
    override def fmt: SQLFmt =
      updateItems.foldLeft[SQLFmt](keyword("set")){(l,r) =>
        l ~| (r._1.fmt ~- "=" ~- r._2.fmt)
      }
  }
  case object MergeDeleteClause extends MergeUpdateOrDelete {
    override def fmt: SQLFmt = keyword("delete")
  }

  case class IgnoredStatement(name: String) extends Statement {
    override def columnsRead: List[ColumnIdent] = Nil
    override def columnsWritten: List[ColumnIdent] = Nil
    override def fmt: SQLFmt = ""
    override def outputs: List[TableSpec] = Nil
    override def inputs: List[TableSpec] = Nil
  }
}
