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

import com.google.cloud.pso.sql.ast.SQL

object SQLFmt {
  def toSQL(show: SQLFmt, style: Fmt = Fmt.Default): Either[Err, String] = {
    val INDENT = "  "
    def trimRight(parts: List[String]): List[String] = {
      val maybeT = parts.reverse.dropWhile(_ == INDENT)
      if (maybeT.headOption.contains("\n")) {
        maybeT.tail.reverse
      } else parts
    }

    def print(x: SQLFmt, indent: Int, parts: List[String]): List[String] = x match {
      case Keyword(k) =>
        parts ++ (style.keywords.format(k) :: Nil)
      case Identifier(i) =>
        parts ++ (style.identifiers.format(i) :: Nil)
      case Text(s) =>
        parts ++ (s :: Nil)
      case Whitespace =>
        parts ++ (" " :: Nil)
      case NewLine =>
        trimRight(parts) ++ ("\n" :: (0 until indent).map(_ => INDENT).toList)
      case Indented(group) =>
        print(NewLine, indent, trimRight(
          print(group.copy(items = NewLine :: group.items), indent + 1, parts)
        ))
      case Group(items) =>
        items.foldLeft(parts) {
          case (part, i) =>
            print(i, indent, part)
        }
    }

    try {
      Right(print(show, 0, Nil).mkString.trim)
    } catch {
      case e: Exception => Left(ParsingError(e.getMessage, -1))
    }
  }

  sealed trait Case {
    def format(str: String): String
  }

  case object UpperCase extends Case {
    override def format(str: String): String = str.toUpperCase
  }

  case object LowerCase extends Case {
    override def format(str: String): String = str.toLowerCase
  }

  case object CamelCase extends Case {
    override def format(str: String): String =
      str.headOption
        .map(_.toString.toUpperCase)
        .getOrElse("") + str.drop(1).toLowerCase
  }

  case class Fmt(pretty: Boolean = true, keywords: Case = UpperCase, identifiers: Case = LowerCase)

  object Fmt {
    val Default: Fmt = Fmt()
    val Compact = Fmt(pretty = false, UpperCase, LowerCase)
  }

  /** Keyword and Identifier capitalization is controlled by Style */
  case class Keyword(keyword: String) extends SQLFmt
  case class Identifier(identifier: String) extends SQLFmt
  /** Text is unmodified by Style */
  case class Text(chars: String) extends SQLFmt
  case class Indented(group: Group) extends SQLFmt
  case class Group(items: List[SQLFmt]) extends SQLFmt
  case object Whitespace extends SQLFmt
  case object NewLine extends SQLFmt

  implicit def toText(str: String): SQLFmt = Text(str)

  /** wrap in parenthesis */
  def paren(show: SQLFmt): SQLFmt = "(" ~ show ~ ")"

  /** wrap in parenthesis indented */
  def paren1(show: SQLFmt): SQLFmt = "(" ~| show ~ ")"
  def line: SQLFmt = NewLine
  def nest(show: SQLFmt*): SQLFmt = Indented(Group(show.toList))
  def keyword(str: String) = Keyword(str)
  def ident(str: String) = Identifier(str)
  def join(items: List[SQLFmt], separator: SQLFmt = commaNewline): SQLFmt.Group = {
    val head = items.dropRight(1).flatMap(_ :: separator :: Nil)
    val tail = items.lastOption.map(_ :: Nil).getOrElse(Nil)
    Group(head ++ tail)
  }
  def values(x: List[SQL]): SQLFmt = paren1(join(x.map(_.fmt)))
  def values1(x: List[SQLFmt]): SQLFmt = paren1(join(x))

  def combine(items: Option[SQLFmt]*): SQLFmt = {
    items.flatten match {
      case l if l.nonEmpty =>
        l.drop(1).foldLeft(l.head){(a,b) => a ~- b}
      case _ =>
        Text("")
    }
  }

  def fmtAll(x: List[SQL]): Option[List[SQLFmt]] =
    Option(x).filter(_.nonEmpty).map(_.map(_.fmt))

  val commaNewline: SQLFmt = Text(",") ~/ Text("")
}

sealed trait SQLFmt {
  import SQLFmt.{Group,Whitespace,NewLine,Indented,Fmt}

  def ~(o: SQLFmt) = Group(this :: o :: Nil)

  def ~(o: Option[SQLFmt]): SQLFmt = o.map(o => Group(this :: o :: Nil)).getOrElse(this)

  def ~-(o: SQLFmt): SQLFmt = Group(this :: Whitespace :: o :: Nil)

  def ~-(o: Option[SQLFmt]): SQLFmt = o.map(o => Group(this :: Whitespace :: o :: Nil)).getOrElse(this)

  def ~/(o: SQLFmt): SQLFmt = Group(this :: NewLine :: o :: Nil)

  def ~/(o: Option[SQLFmt]): SQLFmt = o.map(o => Group(this :: NewLine :: o :: Nil)).getOrElse(this)

  def ~|(o: SQLFmt*) = Group(this :: Indented(Group(o.toList)) :: Nil)

  def ~|(o: Option[SQLFmt]): SQLFmt = o.map(o => Group(this :: Indented(Group(List(o))) :: Nil)).getOrElse(this)

  def print(style: Fmt = Fmt.Default): String =
    SQLFmt.toSQL(this, style).right.getOrElse(sys.error("Failed to print SQL"))
}

