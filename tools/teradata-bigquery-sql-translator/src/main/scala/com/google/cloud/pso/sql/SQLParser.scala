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

import com.google.cloud.pso.sql.ast.{Expression, Statement}

import scala.util.parsing.combinator._
import scala.util.parsing.combinator.syntactical._

trait SQLParser extends TokenParsers with PackratParsers with SQLOperators {
  def parseStatement(sql: String): Either[Err, Statement]

  override type Tokens = SQLTokens
  override val lexical: SQLLexical = new SQLLexical{}
  type Expr = Parser[Expression] => Parser[Expression]

  implicit def stringLiteralToKeywordOrDelimiter(chars: String): Parser[String] = {
    if (lexical.keywords.contains(chars) || lexical.delimiters.contains(chars)) {
      (accept(lexical.Keyword(chars)) | accept(lexical.Delimiter(chars))) ^^ (_.chars) withFailureMessage s"$chars expected"
    } else {
      sys.error(s"""!!! Invalid parser definition: $chars is not a valid SQL keyword or delimiter""")
    }
  }
}
