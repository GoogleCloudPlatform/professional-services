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

import com.google.cloud.pso.sql.RenameMap
import com.google.cloud.pso.sql.SQLFmt
import com.google.cloud.pso.sql.SQLFmt._
import com.google.cloud.pso.sql.ast.Identifiers.ColumnIdent
import com.google.cloud.pso.sql.ast.Literals.StringLiteral
import com.google.cloud.pso.sql.ast.Operators._

object Expressions {

  case class AliasExpression(expression: Expression, alias: String) extends Expression {
    override def visit: List[Expression] = expression::Nil
    override def fmt: SQLFmt = expression.fmt ~- keyword("as") ~- alias
  }
  case class ParenExpression(expression: Expression, indent: Boolean = false) extends Expression {
    override def fmt: SQLFmt = {
      if (indent) paren1(expression.fmt)
      else paren(expression.fmt)
    }
    override def visit: List[Expression] = expression.visit
  }

  case class LiteralExpression(literal: Literal) extends Expression {
    override def visit: List[Expression] = this :: Nil
    override def fmt: SQLFmt = literal.fmt
  }

  case class ColumnExpression(column: ColumnIdent) extends Expression {
    override def visit: List[Expression] = this :: Nil
    override def fmt: SQLFmt = column.fmt
  }

  case class MathExpression(op: String, left: Expression, right: Expression) extends Expression {
    override def fmt: SQLFmt = left.fmt ~- keyword(op) ~- right.fmt
    override def visit: List[Expression] = left.visit ++ right.visit
  }

  object MathExpression {
    def operator(op: String)(left: Expression, right: Expression) = apply(op, left, right)
  }

  case class UnaryMathExpression(op: String, expression: Expression) extends Expression {
    override def fmt: SQLFmt = keyword(op) ~ expression.fmt
    override def visit: List[Expression] = expression.visit
  }

  case class ComparisonExpression(op: String, left: Expression, right: Expression) extends Expression {
    override def fmt: SQLFmt = left.fmt ~- keyword(op) ~- right.fmt
    override def visit: List[Expression] = this :: Nil ++ left.visit ++ right.visit
  }

  object ComparisonExpression {
    def operator(op: String)(left: Expression, right: Expression) = apply(op, left, right)
  }

  case class LikeExpression(left: Expression, not: Boolean, op: String, right: Expression) extends Expression {
    override def fmt: SQLFmt =
      left.fmt ~-
      (if (not) Some(keyword("not")) else None) ~-
      keyword(op) ~- right.fmt

    override def visit: List[Expression] = left.visit ++ right.visit
  }

  object LikeExpression {
    def operator(op: String, not: Boolean)(left: Expression, right: Expression) =
      apply(left, not, op, right)
    def all(not: Boolean, likeExprs: List[StringLiteral], precExpr: Expression): Expression = {
      likeExprs match {
        case first :: rest =>
          val expr1: Expression = LikeExpression(precExpr, not, "like", LiteralExpression(first))
          val all = rest.foldLeft(expr1) { (a, b) =>
            AndExpression("and", a, LikeExpression(precExpr, not, "like", LiteralExpression(b)))
          }
          ParenExpression(all)
        case List(a) =>
          LikeExpression(precExpr, not, "like", LiteralExpression(a))
      }
    }

    def any(not: Boolean, likeExprs: List[StringLiteral], precExpr: Expression): Expression = {
      likeExprs match {
        case first :: rest =>
          if (not) {
            val expr1: Expression = LikeExpression(precExpr, false, "like", LiteralExpression(first))
            val any = rest.foldLeft(expr1) { (a, b) =>
              OrExpression("or", a, LikeExpression(precExpr, false, "like", LiteralExpression(b)))
            }
            NotExpression(ParenExpression(any))
          } else {
            val expr1: Expression = LikeExpression(precExpr, not, "like", LiteralExpression(first))
            val any = rest.foldLeft(expr1) { (a, b) =>
              OrExpression("or", a, LikeExpression(precExpr, not, "like", LiteralExpression(b)))
            }
            ParenExpression(any)
          }
        case List(a) =>
          LikeExpression(precExpr, not, "like", LiteralExpression(a))
      }
    }
  }

  trait BooleanExpression extends Expression {
    def op: String
    def right: Expression
    def left: Expression
    override def fmt: SQLFmt = left.fmt ~/ keyword(op) ~- right.fmt
    override def visit: List[Expression] = left.visit ++ right.visit
  }

  case class AndExpression(op: String, left: Expression, right: Expression) extends BooleanExpression

  object AndExpression {
    def operator(op: String)(left: Expression, right: Expression) =
      apply(op, left, right)
  }

  case class OrExpression(op: String, left: Expression, right: Expression) extends BooleanExpression

  object OrExpression {
    def operator(op: String)(left: Expression, right: Expression) =
      apply(op, left, right)
  }

  case class IsInExpression(left: Expression, not: Boolean, right: List[Expression]) extends Expression {
    override def fmt: SQLFmt = {
      val r: SQLFmt = right match {
        case List(e: SubSelectExpression) =>
          e.fmt
        case _ =>
          paren(join(right.map(_.fmt), ", "))
      }
      left.fmt ~-
      Option(keyword("not")).filter(_ => not) ~-
      keyword("in") ~-
      r
    }

    override def visit: List[Expression] = left.visit ++ visitAll(right)
  }

  case class FunctionCallExpression(name: String, distinct: Option[SetSpec] = None, args: List[Expression] = List.empty) extends Expression {
    override def fmt: SQLFmt = {
      if (name.toLowerCase == "current_timestamp") {
        keyword(name) ~ "()"
      } else if (RenameMap.contains(name)) {
        copy(name = RenameMap(name)).fmt
      } else {
        val argsShow = join(args.map(_.fmt), ", ")
        keyword(name) ~
        paren(distinct.map(_.fmt ~- argsShow).getOrElse(argsShow))
      }
    }

    override def visit: List[Expression] = visitAll(args)
  }

  case class VariableExpression(name: String) extends Expression {
    override def visit: List[Expression] = this :: Nil
    override def fmt: SQLFmt = "{{" ~- ident(name) ~- "}}"
  }

  case object ParameterExpression extends Expression {
    override def visit: List[Expression] = this :: Nil
    override def fmt: SQLFmt = keyword("?")
  }

  case object SetAll extends SetSpec {
    override def fmt: SQLFmt = keyword("all")
  }

  case object SetDistinct extends SetSpec {
    override def fmt: SQLFmt = keyword("distinct")
  }

  case object SortASC extends SortOrder {
    override def fmt: SQLFmt = keyword("asc")
  }

  case object SortDESC extends SortOrder {
    override def fmt: SQLFmt = keyword("desc")
  }

  case class SortExpression(expression: Expression, order: Option[SortOrder]) extends Expression {
    override def fmt: SQLFmt = expression.fmt ~- order.map(_.fmt)
    override def visit: List[Expression] = expression.visit
  }

  trait AggregateOperator extends Operator with Expression

  case object RankOperator extends AggregateOperator {
    override def fmt: SQLFmt = keyword("rank()")
  }

  case object RowNumberOperator extends AggregateOperator {
    override def fmt: SQLFmt = keyword("row_number()")
  }

  case object CountStarExpression extends AggregateOperator {
    override def fmt: SQLFmt = keyword("count(*)")
  }

  case class SumExpression(colExpr: Expression) extends AggregateOperator {
    override def fmt: SQLFmt = keyword("sum") ~ "(" ~ colExpr.fmt ~ ")"
    override def visit: List[Expression] = colExpr :: Nil
  }

  case class IsBetweenExpression(expression: Expression, not: Boolean, bounds: (Expression, Expression)) extends Expression {
    override def fmt: SQLFmt =
      expression.fmt ~-
      (if (not) Some(keyword("not")) else None) ~-
      keyword("between") ~-
      bounds._1.fmt ~-
      keyword("and") ~-
      bounds._2.fmt

    override def visit : List[Expression] =
      expression.visit ++ bounds._1.visit ++ bounds._2.visit
  }

  case class NotExpression(expression: Expression) extends Expression {
    override def fmt: SQLFmt = keyword("not") ~- expression.fmt
    override def visit : List[Expression] = expression.visit
  }

  case class IsExpression(expression: Expression, not: Boolean, literal: Literal) extends Expression {
    override def fmt: SQLFmt =
      expression.fmt ~- keyword("is") ~-
      (if (not) Some(keyword("not")) else None) ~-
      literal.fmt

    override def visit : List[Expression] = expression.visit
  }

  case class ExistsExpression(select: SelectStatement) extends Expression {
    override def visit: List[Expression] = select.visit
    override def fmt: SQLFmt = keyword("exists") ~- paren1(select.fmt)
  }

  case class SubSelectExpression(select: SelectStatement) extends Expression {
    override def visit: List[Expression] = select.visit
    override def fmt: SQLFmt = paren1(select.fmt)
  }

  case class CastExpression(from: Expression, to: TypeLiteral) extends Expression {
    override def fmt: SQLFmt =
      keyword("cast") ~
      paren(
        from.fmt ~-
        keyword("as") ~-
        to.fmt
      )

    override def visit: List[Expression] = from.visit
  }

  case class CaseWhenExpression(value: Option[Expression], mapping: List[(Expression, Expression)], elseVal: Option[Expression]) extends Expression {
    override def fmt: SQLFmt =
      keyword("case") ~- value.map(_.fmt) ~| (
      mapping.map { case (cond, res) =>
        keyword("when") ~- cond.fmt ~-
        keyword("then") ~- res.fmt
      }.reduceLeft(_ ~/ _) ~/
      elseVal.map(keyword("else") ~- _.fmt)
      ) ~/ keyword("end")

    override def visit: List[Expression] =
      value.map(_.visit).getOrElse(Nil) ++
      mapping.flatMap { case (cond, res) => Seq(cond, res) } ++
      elseVal.map(_.visit).getOrElse(Nil)
  }

  case class GroupByExpression(expression: Expression) extends GroupBy {
    override def fmt: SQLFmt = expression.fmt
    override def visit: List[Expression] = expression.visit
  }

  case class GroupingSet(groups: List[Expression]) extends Expression {
    override def fmt: SQLFmt = paren1(join(groups.map(_.fmt)))
    override def visit: List[Expression] = visitAll(groups)
  }

  case class GroupByGroupingSets(groups: List[GroupingSet]) extends GroupBy {
    override def fmt: SQLFmt =
      keyword("grouping") ~- keyword("sets") ~
      paren1(join(groups.map(_.fmt)))
    override def visit: List[Expression] = visitAll(groups)
  }

  case class GroupByRollup(groups: List[Either[Expression, GroupingSet]]) extends GroupBy {
    override def fmt: SQLFmt =
      keyword("rollup") ~
      paren1(join(groups.map(_.fold(_.fmt, _.fmt))))
    override def visit: List[Expression] = groups.flatMap(_.fold(_.visit, _.visit))
  }

  case class GroupByCube(groups: List[Either[Expression, GroupingSet]]) extends GroupBy {
    override def fmt: SQLFmt = keyword("cube") ~ ("(" ~| join(groups.map(_.fold(_.fmt, _.fmt)), "," ~/ "") ~ ")")

    override def visit: List[Expression] = groups.flatMap(_.fold(_.visit, _.visit))
  }


  sealed trait DateAddPart extends Expression
  trait DatePart extends Expression {
    override def fmt: SQLFmt = keyword(this.getClass.getSimpleName)
  }
  // Returns values in the range [1,7] with Sunday as the first day of the week.
  case class DAYOFWEEK() extends DatePart
  case class DAY() extends DatePart with DateAddPart
  case class DAYOFYEAR() extends DatePart
  case class WEEK() extends DatePart with DateAddPart
  case class ISOWEEK() extends DatePart
  case class MONTH() extends DatePart with DateAddPart
  // Returns values in the range [1,4]
  case class QUARTER() extends DatePart with DateAddPart
  case class YEAR() extends DatePart with DateAddPart
  case class ISOYEAR() extends DatePart

  case class IgnoredExpression(name: String) extends Expression {
    override def fmt: SQLFmt = ""
  }

  case class DatePartExpression(part: DatePart, dateExpr: Expression) extends Expression {
    override def fmt: SQLFmt = part.fmt ~- keyword("from") ~- dateExpr.fmt
  }

  case class DateAddExpression(dateExpr: Expression, intervalExpr: Expression, datePart: DateAddPart = DAY(), subtract: Boolean = false) extends Expression {
    override def fmt: SQLFmt = {
      val minus: Option[SQLFmt] = if (subtract) Option[SQLFmt]("-") else None
      keyword("date_add") ~
      paren(
        dateExpr.fmt ~
        "," ~-
        keyword("INTERVAL") ~-
        minus ~-
        intervalExpr.fmt ~-
        datePart.fmt
      )
    }

    override def visit: List[Expression] = dateExpr.visit ++ intervalExpr.visit
  }

  def unnest(e: Expression): List[Expression] = {
    e match {
      case c: ConcatExpression =>
        c.exprs.flatMap(unnest)
      case x: Expression =>
        x :: Nil
    }
  }

  case class ConcatExpression(exprs: List[Expression]) extends Expression {

    override def fmt: SQLFmt = {
      keyword("concat") ~
      paren(join(exprs.flatMap(unnest).map(_.fmt), separator = ", "))
    }

    override def visit: List[Expression] = visitAll(exprs)
  }

  case class PartitionExpression(operator: AggregateOperator, partitionBy: List[Expression] = Nil, orderBy: List[SortExpression] = Nil) extends Expression {
    override def fmt: SQLFmt = {
      operator.fmt ~-
      keyword("over") ~-
      paren(combine(
        fmtAll(partitionBy).map { cols =>
          keyword("partition") ~- keyword("by") ~-
            join(cols, ", ")
        },
        fmtAll(orderBy).map { sortExprs =>
          keyword("order") ~- keyword("by") ~-
            join(sortExprs, ", ")
        }
      ))
    }
    override def visit: List[Expression] = visitAll(partitionBy) ++ visitAll(orderBy)
  }

  case class QualifyExpression(partitionExpression: PartitionExpression, comparisonOperator: ComparisonOperator, comparisonExpression: Expression) extends Expression {
    override def fmt: SQLFmt =
      keyword("qualify") ~-
      partitionExpression.fmt ~-
      comparisonOperator.fmt ~-
      comparisonExpression.fmt
    override def visit: List[Expression] = partitionExpression.visit ++ comparisonExpression.visit
  }
}
