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

package com.google.cloud.bqhiveloader

import com.google.cloud.bqhiveloader.MetaStore.Partition

object PartitionFilters {
  case class PartitionFilter(expressions: Seq[FilterExpression]) {
    @transient
    lazy val filters: Map[String,Seq[FilterExpression]] =
      expressions.groupBy(_.l)

    def filterPartition(partitionValues: Seq[(String,String)]): Boolean = {
      for ((col, value) <- partitionValues) {
        filters.get(col) match {
          case Some(filter) if filter.exists(_.reject(col, value)) =>
            return false
          case _ =>
        }
      }
      true
    }

    /** Applies Partition Filters
      * @param partition Partition to be evaluated
      * @return false if Partition is rejected by a filter expression
      */
    def apply(partition: Partition): Boolean =
      filterPartition(partition.values)

    def apply(partitions: Seq[Partition]): Seq[Partition] = {
      partitions.filter(this(_))
    }
  }

  sealed trait FilterExpression {
    val l: String
    def accept(column: String, value: String): Boolean
    def reject(column: String, value: String): Boolean = !accept(column, value)
  }

  case object MatchAll extends FilterExpression {
    override val l: String = "*"
    override def accept(column: String, value: String): Boolean =
      true
  }

  case class Equals(l: String, r: String) extends FilterExpression {
    override def accept(column: String, value: String): Boolean =
      l == column && (r == "*" || r == value)
  }

  case class GreaterThan(l: String, r: String) extends FilterExpression {
    override def accept(column: String, value: String): Boolean =
      l == column && r < value
  }

  case class LessThan(l: String, r: String) extends FilterExpression {
    override def accept(column: String, value: String): Boolean =
      l == column && r > value
  }

  case class GreaterThanOrEq(l: String, r: String) extends FilterExpression {
    override def accept(column: String, value: String): Boolean =
      l == column && r <= value
  }

  def isDate(s: String): Boolean = {
    if (s.matches("""^\d{4}-\d{2}-\d{2}$""")) true
    else false
  }

  case class LessThanOrEq(l: String, r: String) extends FilterExpression {
    override def accept(column: String, value: String): Boolean =
      l == column && r >= value
  }

  case class In(l: String, r: Set[String]) extends FilterExpression {
    override def accept(column: String, value: String): Boolean =
      l == column && r.contains(value)
  }

  def parse(expr: String): Option[PartitionFilter] = {
    if (expr.nonEmpty){
      val exprs = expr.replaceAllLiterally(" and ", " AND ")
        .replaceAllLiterally(" And ", " AND ")
        .replaceAllLiterally(" in ", " IN ")
        .replaceAllLiterally(" In ", " IN ")
        .split(" AND ")
        .flatMap(parseExpression)
      Option(PartitionFilter(exprs))
    } else None
  }

  def parseExpression(expr: String): Option[FilterExpression] = {
    if (expr.contains("<=")) {
      expr.split("<=").map(_.trim) match {
        case Array(l,r) => Option(LessThanOrEq(l, r))
        case _ => None
      }
    } else if (expr.contains(">=")) {
      expr.split(">=").map(_.trim) match {
        case Array(l,r) => Option(GreaterThanOrEq(l, r))
        case _ => None
      }
    } else if (expr.contains('=')) {
      expr.split('=').map(_.trim) match {
        case Array(l,r) => Option(Equals(l, r))
        case _ => None
      }
    } else if (expr.contains('<')) {
      expr.split('<').map(_.trim) match {
        case Array(l,r) => Option(LessThan(l, r))
        case _ => None
      }
    } else if (expr.contains('>')) {
      expr.split('>').map(_.trim) match {
        case Array(l,r) => Option(GreaterThan(l, r))
        case _ => None
      }
    } else if (expr.contains(" IN ")) {
      expr.split(" IN ").map(_.trim) match {
        case Array(l,r) =>
          val set = r.stripPrefix("(").stripSuffix(")")
            .split(',').map(_.trim).toSet
          Option(In(l, set))
        case _ => None
      }
    } else if (expr.trim == "*") {
      Option(MatchAll)
    } else None
  }
}
