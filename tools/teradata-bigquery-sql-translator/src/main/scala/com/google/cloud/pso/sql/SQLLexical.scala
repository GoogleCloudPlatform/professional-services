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

import scala.util.parsing.combinator.lexical.Lexical
import scala.util.parsing.input.CharArrayReader.EofCh

trait SQLLexical extends Lexical with SQLTokens {
  val keywords: Set[String] = Keywords
  val delimiters: Set[String] = Delimiters
  val identifierDelimiter: Char = '\"'
  val stringDelimiter: Char = '\''

  override lazy val whitespace: Parser[Any] =
    rep(whitespaceChar | blockComment | lineComment)

  override lazy val letter: Parser[Char] = elem("letter", _.isLetter)

  override lazy val token: Parser[Token] =
    customToken |
    identifierOrKeyword |
    decimalLit |
    integerLit |
    stringLit |
    identifier |
    EofCh ^^^ EOF |
    stringDelimiter ~> failure("unclosed string literal") |
    identifierDelimiter ~> failure("unclosed identifier") |
    delimiter |
    failure("illegal character")

  lazy val identifierOrKeyword: Parser[Token] =
    letter ~
      rep(letter | digit | '_') ^^ {
      case first ~ rest =>
        val chars = first :: rest mkString ""
        if (keywords.contains(chars.toLowerCase))
          Keyword(chars.toLowerCase)
        else
          Identifier(chars)
    }

  lazy val expLit1: Parser[DecimalLit] =
    rep1(digit) ~ ('.' ~> rep(digit)) ~ opt(exp) ^^ {
      case i ~ d ~ mE =>
        DecimalLit(i.mkString + "." + d.mkString + mE.mkString)
    }

  lazy val expLit2: Parser[DecimalLit] =
    rep1(digit) ~ exp ^^ {
      case i ~ e =>
        DecimalLit(i.mkString + e)
    }

  lazy val floatLit: Parser[DecimalLit] =
    '.' ~> rep1(digit) ~ opt(exp) ^^ {
      case d ~ mE =>
        DecimalLit("." + d.mkString + mE.mkString)
    }

  lazy val decimalLit: Parser[DecimalLit] =
    expLit1 | expLit2 | floatLit

  lazy val integerLit: Parser[IntegerLit] =
    rep1(digit) ^^ { i => IntegerLit(i.mkString) }

  lazy val stringLit: Parser[StringLit] =
    quoted(delimiter=stringDelimiter) ^^ { chars => StringLit(chars mkString "") }

  lazy val identifier: Parser[Identifier] =
    quoted(delimiter=identifierDelimiter) ^^ { chars => Identifier(chars mkString "") }

  lazy val blockCommentChar: Parser[Seq[Elem]] =
    chrExcept('*', EofCh) ^^ {c => Seq(c)} |
    ('*' ~ chrExcept('/', EofCh)) ^^ { case a ~ b => Seq(a,b)}

  lazy val blockComment: Parser[BlockComment] =
    (('/' ~ '*') ~> rep(blockCommentChar) <~ ('*' ~ '/')) ^^ {x => BlockComment(x.flatten.mkString)}

  lazy val lineComment: Parser[LineComment] =
    '-' ~ '-' ~ rep(chrExcept('\n', '\r', EofCh)) ^^ {
      case _ ~ _ ~ x =>
        LineComment(x.mkString)
    }

  lazy val delimiter: Parser[Delimiter] = {
    val delimiterTokens: Seq[Parser[Delimiter]] =
      delimiters.toList.sorted.map(s => accept(s.toList) ^^^ Delimiter(s))
    val fail: Parser[Delimiter] = failure("no matching delimiter")
    delimiterTokens.foldRight(fail)((x, y) => y | x)
  }

  def customToken: Parser[Token] =
    elem("should not exist", _ => false) ^^ { _ =>
      sys.error("custom token should not exist")
    }

  lazy val exp: Parser[String] =
    (accept('e') | accept('E')) ~
    opt('-') ~
    rep1(digit) ^^ {
      case e ~ n ~ d =>
        e.toString + n.mkString + d.mkString
    }

  private def quoted(delimiter: Char): Parser[List[Char]] =
    delimiter ~>
      rep((delimiter ~ delimiter) ^^^ delimiter |
      chrExcept(delimiter, '\n', EofCh)) <~
    delimiter
}
