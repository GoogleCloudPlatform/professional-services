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

import com.google.cloud.pso.sql.ast.Expressions._
import com.google.cloud.pso.sql.ast.Identifiers.{ColumnIdent, TableSpec}
import com.google.cloud.pso.sql.ast.Joins._
import com.google.cloud.pso.sql.ast.Literals._
import com.google.cloud.pso.sql.ast.Operators._
import com.google.cloud.pso.sql.ast.Projections._
import com.google.cloud.pso.sql.ast.Relations._
import com.google.cloud.pso.sql.ast.Statements._
import com.google.cloud.pso.sql.ast._


class StandardSQLParser extends SQLParser  {

  lazy val ident: Parser[String] =
    elem("ident", _.isInstanceOf[lexical.Identifier]) ^^ (_.chars)

  lazy val booleanLiteral: Parser[BooleanLiteral] =
    "true" ^^^ TrueLiteral |
    "false" ^^^ FalseLiteral |
    "unknown" ^^^ UnknownLiteral

  lazy val nullLiteral: Parser[NullLiteral.type] = "null" ^^^ NullLiteral

  lazy val stringLiteral: Parser[StringLiteral] =
    elem("string", _.isInstanceOf[lexical.StringLit]) ^^ { v => StringLiteral(v.chars) }

  lazy val integerLiteral: Parser[IntegerLiteral] =
    elem("integer", _.isInstanceOf[lexical.IntegerLit]) ^^ { v => IntegerLiteral(v.chars.toLong) }

  lazy val decimalLiteral: Parser[DecimalLiteral] =
    elem("decimal", _.isInstanceOf[lexical.DecimalLit]) ^^ { v => DecimalLiteral(v.chars.toDouble) }

  lazy val literal: Parser[Literal] =
    pos(decimalLiteral | integerLiteral | stringLiteral | booleanLiteral | nullLiteral)

  lazy val intLiteral: Parser[IntegerLiteral] =
    pos(integerLiteral)

  lazy val integerTypeLiteral: Parser[IntegerTypeLiteral.type] =
    (kw("int") | kw("integer") | kw("bigint")) ^^ {_ => IntegerTypeLiteral}

  lazy val numericTypeLiteral: Parser[NumericTypeLiteral.type] =
    (kw("number") | kw("numeric") | kw("decimal")) ~ opt(lp ~> intLiteral ~ comma ~ intLiteral <~ rp) ^^ {_ => NumericTypeLiteral}

  lazy val lp: Parser[String] = "("
  lazy val rp: Parser[String] = ")"
  lazy val comma: Parser[String] = ","
  lazy val as: Parser[String] = "as"
  lazy val period: Parser[String] = "."

  lazy val varcharTypeLiteral: Parser[VarcharTypeLiteral] =
    "varchar" ~ opt(lp ~> integerLiteral <~ rp) ^^ {
      case _ ~ Some(k) => VarcharTypeLiteral(Option(k.value))
      case _ ~ _ => VarcharTypeLiteral()
    }

  lazy val charTypeLiteral: Parser[VarcharTypeLiteral] =
    kw("char") ~ opt(lp ~> integerLiteral <~ rp) ^^ {
      case _ ~ Some(k) => VarcharTypeLiteral(Option(k.value))
      case _ ~ _ => VarcharTypeLiteral()
    }

  lazy val timestampTypeLiteral: Parser[TimestampTypeLiteral] =
    kw("timestamp") ~ opt(lp ~> integerLiteral <~ rp) ^^ {
      case _ ~ Some(k) => TimestampTypeLiteral(Option(k.value))
      case _ ~ _ => TimestampTypeLiteral()
    }

  lazy val dateTypeLiteral: Parser[DateTypeLiteral] =
    kw("date") ~ opt(kw("format") ~> stringLiteral) ^^ {case _ ~ b => DateTypeLiteral(b.map(_.value))}

  lazy val typeLiteral: Parser[TypeLiteral] =
    varcharTypeLiteral |
    timestampTypeLiteral |
    integerTypeLiteral |
    charTypeLiteral |
    dateTypeLiteral |
    numericTypeLiteral |
    elem("type literal", t => typeMap.contains(t.chars.toLowerCase)) ^^ { t =>
      typeMap(t.chars.toLowerCase)
    }

  lazy val alias: Parser[Option[String]] =
    opt(opt(as) ~> ident)

  lazy val columnIdent: Parser[ColumnIdent] =
    ident ~ period ~ ident ~ period ~ ident ^^ {
      case s ~ _ ~ t ~ _ ~ c =>
        ColumnIdent(c, Some(TableSpec(t, Some(s))))
    } |
    ident ~ period ~ ident ^^ {
      case t ~ _ ~ c =>
        ColumnIdent(c, Some(TableSpec(t, None)))
    } |
    ident ^^ {ColumnIdent(_, None)}

  lazy val column: Parser[ColumnIdent] =
    pos(columnIdent)

  lazy val bashVariable: Parser[VariableExpression] =
    opt(ident) ~ (("$" ~ opt("{")) ~> ident <~ opt("}")) ~ opt("_" ~ rep("_"|period|ident)) ^^ {case a ~ b ~ c =>
      c match {
        case Some(x ~ y) =>
          VariableExpression(a.getOrElse("") + b + x + y.map(_.mkString))
        case _ =>
          VariableExpression(a.getOrElse("") + b)
      }
    }

  // require _ here after the variable otherwise it captures table alias
  lazy val jinjaVariable: Parser[VariableExpression] =
    opt(ident) ~ ("{{" ~> ident <~ "}}") ~ opt("_" ~ rep("_"|period|ident)) ^^ {case a ~ b ~ c =>
      c match {
        case Some(x ~ y) =>
          VariableExpression(a.getOrElse("") + b + x + y.map(_.mkString))
        case _ =>
          VariableExpression(a.getOrElse("") + b)
      }
    }

  // Allow a bash variable to be parsed as a valid table identifier
  lazy val bashTable: Parser[TableSpec] =
    opt(ident <~ period) ~ bashVariable ^^ {
      case a ~ b =>
        TableSpec(b.fmt.print(), dataset = a)
    }

  // Allow a jinja variable to be parsed as a valid table identifier
  lazy val jinjaTable: Parser[TableSpec] =
    opt(ident <~ period) ~ jinjaVariable ^^ {
      case a ~ b =>
        TableSpec(b.fmt.print(), dataset = a)
    }

  lazy val table: Parser[TableSpec] =
    ident ~ period ~ ident ~ period ~ ident ^^ {
      case d ~ _ ~ s ~ _ ~ t =>
        TableSpec(t, Option(s), Option(d))
    } |
    ident ~ period ~ ident ^^ {
      case s ~ _ ~ t =>
        TableSpec(t, Some(s))
    } |
    ident ^^ {TableSpec(_, None)}

  lazy val bigQueryFunctionName: Parser[String] =
    elem("bqfn", s => BQFunctions.All.contains(s.chars.toUpperCase)) ^^ (_.chars.toLowerCase)

  lazy val function: Parser[FunctionCallExpression] =
    bigQueryFunctionName ~ (lp ~> opt(distinct) ~ repsep(expr, comma) <~ rp) ^^ {
      case n ~ (d ~ a) =>
        FunctionCallExpression(n.toLowerCase, d, a)
    }

  lazy val count: Parser[Elem] =
    elem("count", _.chars.toLowerCase == "count")

  lazy val sum: Parser[SumExpression] =
    kw("sum") ~> lp ~> expr <~ rp ^^ SumExpression

  lazy val countStar: Parser[CountStarExpression.type] =
    count ~ lp ~ "*" ~ rp ^^^ CountStarExpression

  lazy val or: Expr = (precExpr: Parser[Expression]) =>
    precExpr * orOperators.map{op => op ^^^ OrExpression.operator(op) _}.reduce(_ | _)

  lazy val and: Expr = (precExpr: Parser[Expression]) =>
    precExpr * andOperators.map { op =>op ^^^ AndExpression.operator(op) _}.reduce(_ | _)

  lazy val not: Expr = (precExpr: Parser[Expression]) => {
    def thisExpr: Parser[Expression] = {
      "not" ~> thisExpr ^^ NotExpression | precExpr
    }
    thisExpr
  }

  lazy val exists: Expr = (precExpr: Parser[Expression]) =>
    "exists" ~> lp ~> select <~ rp ^^ ExistsExpression | precExpr

  lazy val comparator: Expr = (precExpr: Parser[Expression]) =>
    precExpr * comparisonOperators.map { op => op ^^^ ComparisonExpression.operator(op) _ }.reduce(_ | _)

  lazy val like: Expr = (precExpr: Parser[Expression]) =>
    precExpr * likeOperators.map{op => opt("not") <~ op ^^ {o => LikeExpression.operator(op, o.isDefined) _}}.reduce(_ | _)

  def kw(s: String): Parser[String] = {
    val s1 = s.toLowerCase
    elem(s, _.chars.toLowerCase == s1) ^^ { _ => s1}
  }

  lazy val all: Parser[String] = kw("all")
  lazy val any: Parser[String] = kw("any")

  lazy val stringList: Parser[List[StringLiteral]] =
    lp ~> rep1sep(stringLiteral, comma) <~ rp

  lazy val teradataLikeAll: Expr = (precExpr: Parser[Expression]) => {
    precExpr ~ opt("not") ~ "like" ~ all ~ stringList ^^ {
      case left ~ maybeNot ~ _ ~ _ ~ likeExprs =>
        val not: Boolean = maybeNot.isDefined
        LikeExpression.all(not, likeExprs, left)
    } | precExpr
  }

  lazy val teradataLikeAny: Expr = (precExpr: Parser[Expression]) => {
    precExpr ~ opt("not") ~ "like" ~ any ~ stringList ^^ {
      case left ~ maybeNot ~ _ ~ _ ~ likeExprs =>
        val not: Boolean = maybeNot.isDefined
        LikeExpression.any(not, likeExprs, left)
    } | precExpr
  }

  lazy val teradataConcat: Expr = (precExpr: Parser[Expression]) => {
    precExpr ~ "||" ~ expr ^^ {
      case a ~ _ ~ b =>
        ConcatExpression(unnest(a) ++ unnest(b))
    } | precExpr
  }

  lazy val limit: Parser[IntegerLiteral] = "limit" ~> integerLiteral

  lazy val between: Expr = (precExpr: Parser[Expression]) =>
    precExpr ~ rep(opt("not") ~ ("between" ~> precExpr ~ ("and" ~> precExpr))) ^^ {
      case l ~ r =>
        r.foldLeft(l) {
          case (e, n ~ (lb ~ ub)) =>
            IsBetweenExpression(e, n.isDefined, (lb, ub))
        }
    }

  lazy val in2: Expr = (precExpr: Parser[Expression]) =>
    precExpr ~ rep(opt("not") ~ "in" ~ subselectExpr) ^^ {
      case l ~ r =>
        r.foldLeft(l) {
          case (a, b ~ _ ~ d) =>
                IsInExpression(a, b.isDefined, d:: Nil)
        }
    }

  lazy val columnExpressionList: Parser[List[Expression]] =
    lp ~> rep1sep(columnExpr, comma) <~ rp
  lazy val expressionList: Parser[List[Expression]] =
    lp ~> rep1sep(expr, comma) <~ rp

  lazy val in: Expr = (precExpr: Parser[Expression]) =>
    precExpr ~ rep(opt("not") ~ ("in" ~> expressionList)) ^^ {
      case l ~ r =>
        r.foldLeft(l) {
          case (e, n ~ l1) =>
            IsInExpression(e, n.isDefined, l1)
        }
    }

  lazy val is: Expr = (precExpr: Parser[Expression]) =>
    precExpr ~ rep("is" ~> opt("not") ~ (booleanLiteral | nullLiteral)) ^^ {
      case l ~ r =>
        r.foldLeft(l) {
          case (e, n ~ l1) =>
            IsExpression(e, n.isDefined, l1)
        }
    }

  lazy val add: Expr = (precExpr: Parser[Expression]) =>
    precExpr * additionOperators
      .map{op =>
        op ^^^ MathExpression.operator(op) _
      }
      .reduce(_ | _)

  lazy val multiply: Expr = (precExpr: Parser[Expression]) =>
      precExpr * multiplicationOperators.map{op => op ^^^ MathExpression.operator(op) _}.reduce(_ | _)

  lazy val unary: Expr = (precExpr: Parser[Expression]) =>
    ((unaryOperators.map{op =>
      op ~ precExpr ^^ {
        case `op` ~ p =>
          UnaryMathExpression(op, p)
      }
    }: Set[Parser[Expression]]) + precExpr)
    .reduce(_ | _)

  lazy val cast: Parser[CastExpression] =
    ("cast" ~ lp ~> expr <~ as) ~ typeLiteral <~ rp ^^ {
      case e ~ t =>
        CastExpression(e, t)
    }

  lazy val caseWhen: Parser[CaseWhenExpression] =
    "case" ~> opt(expr) ~ when ~ opt("else" ~> expr) <~ "end" ^^ {
      case maybeValue ~ whenList ~ maybeElse =>
        CaseWhenExpression(maybeValue, whenList, maybeElse)
    }

  lazy val whenExpr: Parser[(Expression, Expression)] =
    "when" ~> expr ~ ("then" ~> expr) ^^ {
      case a ~ b =>
        (a, b)
    }

  lazy val when: Parser[List[(Expression, Expression)]] =
    rep1(whenExpr)

  lazy val currentDateFn: Parser[FunctionCallExpression] =
    kw("current_date") <~ opt(lp ~ rp) ^^ {s => FunctionCallExpression(s)}

  // Teradata only
  lazy val pastDate: Parser[DateAddExpression] =
    currentDateFn ~ ("-"|"+") ~ intLiteral ^^ {
      case a ~ b ~ c =>
        val sign = if (b == "-") -1L else 1L
        DateAddExpression(
          a,
          LiteralExpression(c.copy(value = c.value * sign))
        )
    }

  // Teradata only
  lazy val interval: Parser[String] = kw("interval")
  lazy val day: Parser[String] = kw("day")
  lazy val plus: Parser[String] = "+"
  lazy val minus: Parser[String] = "-"
  lazy val plusInterval: Parser[DateAddExpression] =
    expr ~ plus ~ interval ~ expr ~ day ^^ {
      case a ~ _ ~ _ ~ d ~ _ =>
        DateAddExpression(dateExpr = a, intervalExpr = d)
    }

  val endsWithDate: Parser[String] =
    elem("date", _.chars.toLowerCase.endsWith("date")) ^^ {s => s.chars}

  lazy val timestampArithmetic: Parser[DateAddExpression] =
    (kw("current_timestamp") ~ lp ~ integerLiteral ~ rp) ~ (minus | plus) ~  (interval ~> expr) ~ dateAddPart ^^ {
      case _ ~ b ~ c ~ d =>
        DateAddExpression(dateExpr = FunctionCallExpression("current_timestamp"), c, d, b == "-")
    }

  lazy val minusInterval: Parser[DateAddExpression] =
    expr ~ minus ~ interval ~ expr ~ day ^^ {
      case a ~ _ ~ _ ~ d ~ _ =>
        DateAddExpression(dateExpr = a, intervalExpr = d, subtract = true)
    }

  lazy val dateArithmetic: Parser[DateAddExpression] =
    endsWithDate ~ (minus|plus) ~ expr ^^ {
      case a ~ b ~ c =>
        DateAddExpression(dateExpr = ColumnExpression(ColumnIdent(a)), intervalExpr = c, subtract = b == "-")
    }

  lazy val teradataOReplaceFn: Parser[FunctionCallExpression] =
    kw("oreplace") ~ (lp ~> rep1sep(expr, ",") <~ rp) ^^ {
      case a~b =>
        FunctionCallExpression("replace", args = b)
    }

  lazy val teradataPositionFn: Parser[FunctionCallExpression] =
    kw("position") ~ (lp ~> expr) ~ ("in" ~> expr <~ rp) ^^ {
      case a~b~c =>
        FunctionCallExpression("strpos", args = c::b::Nil)
    }

  lazy val teradataIndexFn: Parser[FunctionCallExpression] =
    kw("index") ~ (lp ~> expr) ~ ("," ~> expr <~ rp) ^^ {
      case a~b~c =>
        FunctionCallExpression("strpos", args = b::c::Nil)
    }

  lazy val teradataRegexpSubstrFn: Parser[FunctionCallExpression] =
    kw("regexp_substr") ~ (lp ~> expr) ~ ("," ~> expr <~ "," <~ kw("1") <~ "," <~ kw("1") <~ rp) ^^ {
      case a~b~c =>
        FunctionCallExpression("regexp_extract", args = b::c::Nil)
    }

  def replaceDateFormat(s: String): LiteralExpression = {
    val s1 = s
      .replace("YYYY", "%Y")
      .replace("MM", "%m")
      .replace("DD", "%d")
      .replace("HH24", "%H")
      .replace("MI", "%M")
      .replace("SS", "%S")
    LiteralExpression(StringLiteral(s1))
  }

  lazy val teradataToCharFn: Parser[FunctionCallExpression] =
    kw("to_char") ~ (lp ~> expr) ~ ("," ~> stringLiteral <~ rp) ^^ {
      case a~b~c =>
        // TODO convert date format expression https://cloud.google.com/bigquery/docs/reference/standard-sql/date_functions#supported_format_elements_for_date
        val dateFmt = replaceDateFormat(c.value)
        FunctionCallExpression("format_datetime", args = dateFmt::b::Nil)
    }

  lazy val teradataSha256Fn: Parser[FunctionCallExpression] =
    (kw("hash_sha256")|kw("hash_sha512")|kw("hash_sha1")|kw("hash_md5")) ~ (lp ~> expr <~ rp) ^^ {
      case a~b =>
        FunctionCallExpression(a.stripPrefix("hash_"), args = b::Nil)
    }

  lazy val teradataAddMonthsFn: Parser[DateAddExpression] =
    (kw("add_months") ~> lp ~> expr) ~ (comma ~> expr <~ rp) ^^ {
      case a ~ b =>
        DateAddExpression(dateExpr = a, intervalExpr = b, datePart = MONTH())
    }

  lazy val teradataSubstringFn: Parser[FunctionCallExpression] = {
    kw("substring") ~>
    lp ~>
    expr ~
    ("from" ~> integerLiteral) ~
    (kw("for") ~> integerLiteral <~ rp) ^^ {
      case a ~ b ~ c =>
        val args: List[Expression] = a :: LiteralExpression(b) :: LiteralExpression(c) :: Nil
        FunctionCallExpression("substr", args = args)
    }
  }

  lazy val extractFn: Parser[FunctionCallExpression] =
    kw("extract") ~> lp ~> extractExpr <~ rp ^^ {
      case a =>
        FunctionCallExpression("extract", args = a::Nil)
    }

  lazy val yearDateAddPart: Parser[DateAddPart] = kw("year") ^^ {_ => YEAR()}
  lazy val monthDateAddPart: Parser[DateAddPart] = kw("month") ^^ {_ => MONTH()}
  lazy val dayDateAddPart: Parser[DateAddPart] = kw("day") ^^ {_ => DAY()}
  lazy val dateAddPart: Parser[DateAddPart] = yearDateAddPart | monthDateAddPart | dayDateAddPart

  lazy val yearDatePart: Parser[DatePart] = kw("year") ^^ {_ => YEAR()}
  lazy val monthDatePart: Parser[DatePart] = kw("month") ^^ {_ => MONTH()}
  lazy val dayDatePart: Parser[DatePart] = kw("day") ^^ {_ => DAY()}
  lazy val datePart: Parser[DatePart] = yearDatePart | monthDatePart | dayDatePart

  lazy val extractExpr: Parser[DatePartExpression] =
    datePart ~ ("from" ~> expr)^^ {
      case a ~ b =>
        DatePartExpression(a, b)
    }

  lazy val aliasExpression: Parser[AliasExpression] =
    expr ~ (as ~> ident) ^^ {case a ~ b => AliasExpression(a,b)}

  lazy val literalExpr: Parser[LiteralExpression] =
    literal ^^ LiteralExpression

  lazy val columnExpr: Parser[ColumnExpression] =
    column ^^ ColumnExpression

  lazy val subselectExpr: Parser[SubSelectExpression] =
    lp ~> select <~ rp ^^ SubSelectExpression

  lazy val parenExpr: Parser[ParenExpression] =
    lp ~> expr <~ rp ^^ {x => ParenExpression(x)}

  lazy val paramExpr: Parser[ParameterExpression.type] =
    "?" ^^ {_ => ParameterExpression}

  lazy val teradataInMultiExpr: Parser[Expression] =
    expressionList ~ opt("not") ~ ("in" ~> subselectExpr) ^^ {
      case a ~ b ~ c =>
        val not = b.isDefined
        val inExprs = a.map{e =>
          IsInExpression(e, not, c::Nil)
        }
        inExprs match {
          case first :: rest =>
            val and = rest.foldLeft[Expression](first){(a,b) =>
              AndExpression("and", a, b)
            }
            ParenExpression(and, indent=true)
          case Nil =>
            // This should never happen
            LiteralExpression(TrueLiteral)
        }
    }

  lazy val teradataFns: Parser[Expression] =
    teradataInMultiExpr | pastDate | plusInterval | minusInterval | dateArithmetic | timestampArithmetic | teradataSubstringFn | teradataAddMonthsFn | teradataSha256Fn | teradataOReplaceFn | teradataPositionFn | teradataIndexFn | teradataRegexpSubstrFn | teradataToCharFn

  lazy val variable: Parser[VariableExpression] =
    bashVariable | jinjaVariable

  lazy val simpleExpr: Expr = _ => {
    literalExpr |
    variable |
    partitionExpression |
    currentDateFn |
    teradataFns |
    extractFn |
    function |
    countStar |
    cast |
    caseWhen |
    columnExpr |
    subselectExpr |
    parenExpr |
    paramExpr |
    aliasExpression
  }

  lazy val precedenceOrder: List[Expr] =
    simpleExpr :: unary :: multiply :: add :: is :: in :: in2 ::
    between :: comparator ::
    teradataLikeAll :: teradataLikeAny :: teradataConcat::
    like :: exists :: not :: and :: or :: Nil

  private val invalidExpression: Parser[Expression] = failure("Invalid expression")
  private val expressionExpected: Parser[Expression] = failure("expression expected")

  lazy val expr: PackratParser[Expression] = {
    precedenceOrder.reverse.foldRight(invalidExpression){(a, b) =>
      a(pos(b) | expressionExpected)
    }
  }

  lazy val starProjection: Parser[Projection] =
    "*" ^^^ AllColumns

  lazy val dotStar: Parser[String] =
    period ~> "*"

  lazy val tableProjection: Parser[Projection] =
    table <~ dotStar ^^ {t => AllTableColumns(t)}

  lazy val exprProjection: Parser[Projection] =
    expr ~ opt(opt(as) ~> (ident | stringLiteral)) ^^ {
      case e ~ a =>
        val literals = a.collect{
          case StringLiteral(v) =>
            v
          case a: String =>
            a
        }
        ExpressionProjection(e, literals)
    }

  lazy val projections: Parser[Projection] =
    pos(starProjection |
      tableProjection |
      exprProjection |
      failure("expected *, table or expression"))

  lazy val relations: Parser[List[Relation]] =
    "from" ~> rep1sep(relation, comma)

  lazy val updateRelations: Parser[List[SingleTableRelation]] =
    "from" ~> rep1sep(singleTableRelation, comma)

  lazy val setClause: Parser[List[Expression]] =
    "set" ~> rep1sep(expr, comma)

  lazy val relation: PackratParser[Relation] =
    pos(joinRelation |
      singleTableRelation |
      subSelectRelation |
      failure("expected join, table, or subselect"))

  lazy val mergeRelation: Parser[Expression] =
    singleTableRelation | subSelectRelation

  lazy val insertRelation: Parser[InsertRelation] =
    (bashTable | jinjaTable | table) ~ opt(as) ~ opt(ident) ^^ {
      case a ~ _ ~ b =>
        InsertRelation(a,b)
    }

  lazy val singleTable: Parser[TableSpec] =
    bashTable | jinjaTable | table

  lazy val singleTableRelation: Parser[SingleTableRelation] =
    singleTable ~ opt(opt(as) ~> (ident | stringLiteral)) ^^ {
      case t ~ a =>
        val literals = a.collect {
          case StringLiteral(v) => v
          case a: String => a
        }
        SingleTableRelation(t, literals)
    }

  lazy val subSelectRelation: Parser[SubSelectRelation] =
    (lp ~> select <~ rp) ~ (opt(as) ~> ident) ^^ {
      case s ~ a => SubSelectRelation(s, a)
    }

  lazy val join: Parser[Join] =
    opt("inner") ~ "join" ^^^ InnerJoin |
    "left" ~ opt("outer") ~ "join" ^^^ LeftJoin |
    "right" ~ opt("outer") ~ "join" ^^^ RightJoin |
    "full" ~ opt("outer") ~ "join" ^^^ FullJoin |
    "cross" ~ "join" ^^^ CrossJoin

  lazy val joinRelation: Parser[JoinRelation] =
    relation ~ join ~ relation ~
    opt("on" ~> expr) ^^ {
      case l ~ j ~ r ~ o =>
        JoinRelation(l, j, r, o)
    }

  lazy val filters: Parser[Expression] =
    "where" ~> expr

  lazy val groupingSet: Parser[GroupingSet] =
    lp ~ rp ^^^ GroupingSet(Nil) |
    lp ~> repsep(expr, comma) <~ rp ^^ GroupingSet

  lazy val groupingSetOrExpr: Parser[Either[Expression, GroupingSet]] =
    groupingSet ^^ Right.apply |
    expr ^^ Left.apply

  lazy val group: Parser[GroupBy] =
    ("grouping" ~ "sets") ~>
    (lp ~> repsep(groupingSet, comma) <~ rp) ^^ GroupByGroupingSets |
    "rollup" ~> (lp ~> repsep(groupingSetOrExpr, comma) <~ rp) ^^ GroupByRollup |
    "cube" ~> (lp ~> repsep(groupingSetOrExpr, comma) <~ rp) ^^ GroupByCube |
    expr ^^ GroupByExpression

  lazy val groupBy: Parser[List[GroupBy]] =
    ("group" ~ "by") ~>
    repsep(group, comma)

  lazy val having: Parser[Expression] =
    "having" ~>
    expr

  lazy val sortOrder: Parser[SortOrder] =
    "asc" ^^^ SortASC |
    "desc" ^^^ SortDESC

  lazy val sortExpr: Parser[SortExpression] =
    columnExpr ~ opt(sortOrder) ^^ {
      case e ~ o =>
        SortExpression(e, o)
    }

  lazy val orderBy: Parser[List[SortExpression]] =
    ("order" ~ "by") ~>
    repsep(sortExpr, comma)

  lazy val distinct: Parser[SetSpec] =
    "distinct" ^^^ SetDistinct | "all" ^^^ SetAll

  lazy val unionSelect: Parser[SelectUnion] =
    select ~ ("union" ~> opt(distinct)) ~ select ^^ {
      case l ~ d ~ r =>
        SelectUnion(l, d, r)
    }

  lazy val partitionBy: Parser[List[Expression]] =
    ("partition" ~ "by") ~> rep1sep(expr, comma)

  lazy val rowNumber: Parser[RowNumberOperator.type] =
    kw("row_number") ~> lp ~> rp ^^ {_ => RowNumberOperator}

  lazy val rank: Parser[RankOperator.type] =
    kw("rank") ~> lp ~> rp ^^ {_ => RankOperator}

  lazy val aggregateOperator: Parser[AggregateOperator] =
    rowNumber | rank | countStar | sum

  lazy val equalsOperator: Parser[EqualsOperator.type] =
    "=" ^^ {_ => EqualsOperator}

  lazy val notEqualOperator: Parser[NotEqualOperator.type] =
    "<>" ^^ {_ => NotEqualOperator}

  lazy val lessThanOperator: Parser[LessThanOperator.type] =
    "<" ^^ {_ => LessThanOperator}

  lazy val lessThanOrEqualOperator: Parser[LessThanOrEqualOperator.type] =
    "<=" ^^ {_ => LessThanOrEqualOperator}

  lazy val greaterThanOperator: Parser[GreaterThanOperator.type] =
    ">" ^^ {_ => GreaterThanOperator}

  lazy val greaterThanOrEqualOperator: Parser[GreaterThanOrEqualOperator.type] =
    ">=" ^^ {_ => GreaterThanOrEqualOperator}

  lazy val inOperator: Parser[InOperator.type] =
    "in" ^^ {_ => InOperator}

  lazy val notInOperator: Parser[NotInOperator.type] =
    "not" ~> "in" ^^ {_ => NotInOperator}

  lazy val comparisonOperator: Parser[ComparisonOperator] =
    equalsOperator | notEqualOperator |
    lessThanOperator | lessThanOrEqualOperator |
    greaterThanOperator | greaterThanOrEqualOperator |
    inOperator | notInOperator
  
  lazy val partitionExpression: Parser[PartitionExpression] =
    (aggregateOperator <~ "over" <~ lp) ~
    opt(partitionBy) ~
    opt(orderBy) ~
    rp ^^ {
    case a ~ b ~ c ~ _ =>
      PartitionExpression(a, b.getOrElse(Nil), c.getOrElse(Nil))
    }

  lazy val teradataQualifyKw: Parser[String] = "qualify"

  lazy val teradataQualify1: Parser[QualifyExpression] =
    teradataQualifyKw ~>
    partitionExpression ~
    comparisonOperator ~
    expr ^^ {
      case a ~ b ~ c =>
        QualifyExpression(a, b, c)
    }

  // Allow partition expression to be on the right
  lazy val teradataQualify2: Parser[QualifyExpression] =
    teradataQualifyKw ~>
    expr ~
    comparisonOperator ~
    partitionExpression ^^ {
      case e ~ o ~ part =>
        val op = o match {
          case LessThanOperator =>
            GreaterThanOperator
          case LessThanOrEqualOperator =>
            GreaterThanOrEqualOperator
          case GreaterThanOperator =>
            LessThanOperator
          case GreaterThanOrEqualOperator =>
            LessThanOrEqualOperator
          case EqualsOperator =>
            EqualsOperator
          case _ =>
            sys.error("IN and NOT IN not accepted by qualify with aggregate on right")
        }
        QualifyExpression(part, op, e)
    }

  lazy val qualify: Parser[QualifyExpression] =
    teradataQualify1 | teradataQualify2

  lazy val simpleSelect: Parser[Select] =
    "select" ~>
    opt(distinct) ~
    rep1sep(projections, comma) ~
    opt(relations) ~
    opt(qualify) ~
    opt(filters) ~
    opt(groupBy) ~
    opt(having) ~
    opt(orderBy) ~
    opt(qualify) ~
    opt(limit) ^^ {
      case d ~ p ~ r ~ q1 ~ f ~ g ~ h ~ o ~ q2 ~ l =>
        val q = q1.orElse(q2)
        Select(d, p, r.getOrElse(Nil), f, g.getOrElse(Nil), h, o.getOrElse(Nil), q, l)
    }

  lazy val teradataLockTable: Parser[IgnoredStatement] =
    kw("lock") ~> "table" ~>
    singleTable ~
    kw("for") ~> kw("exclusive") ^^ {_ => IgnoredStatement("lock table")}

  lazy val teradataDiagnostic: Parser[IgnoredStatement] =
    kw("diagnostic") ~> ident ~>
    "on" ~> kw("for") ~> kw("session") ^^ {_ => IgnoredStatement("diagnostic")}

  lazy val teradataDataOption: Parser[IgnoredExpression] =
    "with" ~> kw("data") ^^ {_ => IgnoredExpression("with data")}

  lazy val teradataIndexColumns: Parser[List[ColumnIdent]] =
    opt(opt(kw("unique")) ~> kw("primary") ~> kw("index") ~> columnList) ^^ {
      case Some(x) => x
      case _ => Nil
    }

  lazy val teradataCommitOption: Parser[IgnoredExpression] =
    "on" ~> kw("commit") ~>
    kw("preserve") ~> kw("rows") ^^ {_ => IgnoredExpression("with data")}

  lazy val update1: Parser[Update] = {
    "update" ~>
    insertRelation ~
    opt(relations) ~
    opt(setClause) ~
    opt(filters) ^^ {
      case r0 ~ r1 ~ s ~ f =>
        Update(r0, r1.getOrElse(Nil), s.getOrElse(Nil), f)
    }
  }

  lazy val columnList: Parser[List[ColumnIdent]] =
    lp ~> repsep(column, comma) <~ rp

  lazy val simpleInsert: Parser[Insert] = {
    ("insert" ~> "into") ~>
    insertRelation ~
    opt(columnList) ~
    select ^^ {
      case u ~ c ~ s =>
        Insert(u, c.getOrElse(Nil), s)
    }
  }
  lazy val teradataTableOptions: Parser[Option[IgnoredExpression]] =
    opt(opt(kw("multiset")) ~ opt(kw("volatile"))) ^^ {_ => Option(IgnoredExpression("multiset volatile"))}

  lazy val teradataCreateTableOptions: Parser[List[ColumnIdent]] =
    opt(teradataDataOption) ~
    teradataIndexColumns ~
    opt(teradataCommitOption) ^^ {case _ ~ b ~ _ => b}

  lazy val teradataCreateTableAsSelect: Parser[CreateTableAsSelect] =
    "create" ~> teradataTableOptions ~>
    "table" ~> singleTableRelation ~
    as ~ opt(lp) ~ select ~ opt(rp) ~
    teradataCreateTableOptions ^^ {
      case a ~ _ ~ _ ~ b ~ _ ~ d =>
        CreateTableAsSelect(a, b, d)
    }

  lazy val typeList: Parser[List[(ColumnIdent,TypeLiteral)]] =
    lp ~> rep1sep(ident ~ typeLiteral, comma) <~ rp ^^ {_.map{case a ~ b => (ColumnIdent(a),b)}}

  lazy val teradataCreateTable: Parser[CreateTable] =
    ("create" ~> teradataTableOptions ~> "table") ~>
    singleTableRelation ~
    typeList ~
    teradataIndexColumns ~
    teradataCommitOption ^^ {
      case a ~ b ~ c ~ _ =>
        CreateTable(a,b, clusterBy = c)
    }

  lazy val select: PackratParser[SelectStatement] =
    pos(unionSelect | simpleSelect | failure("select expected"))

  lazy val update: PackratParser[UpdateStatement] =
    pos(update1 | failure("update expected"))

  lazy val insert: PackratParser[InsertStatement] =
    pos(simpleInsert | failure("insert expected"))

  lazy val createTable: PackratParser[CreateTableStatement] =
    pos(teradataCreateTableAsSelect | teradataCreateTable | failure("create table expected"))

  lazy val statement: Parser[Statement] =
    pos(select | insert | update | createTable | merge | ignored | failure("statement expected"))

  lazy val teradataColumnKw: Parser[String] = kw("column")

  lazy val teradataStats: Parser[IgnoredStatement] =
    (kw("collect")| "drop") ~>
    (kw("statistics") | kw("stats")) ~
    matchAny ^^ {_ => IgnoredStatement("statistics")}

  lazy val matchAny: Parser[IgnoredExpression] =
    rep(elem("any", _ => true)) ^^ {_ => IgnoredExpression("any")}

  lazy val ignored: Parser[IgnoredStatement] =
    kw("bt") ^^{_ => IgnoredStatement("bt")} |
    kw("et") ^^{_ => IgnoredStatement("et")} |
    teradataStats |
    delete |
    teradataLockTable |
    teradataDiagnostic |
    dropTable

  lazy val delete: Parser[IgnoredStatement] =
    "delete" ~> opt("from") ~> insertRelation ~ opt(filters) ^^ {_ => IgnoredStatement("delete")}

  lazy val dropTable: Parser[IgnoredStatement] =
    "drop" ~> "table" ~ matchAny ^^ {_ => IgnoredStatement("drop table")}

  lazy val mergeWhenClause: Parser[List[MergeWhenClause]] =
    rep(matchedClause | notMatchedByTargetClause | notMatchedBySourceClause)

  lazy val mergeDeleteClause: Parser[MergeUpdateOrDelete] =
    "delete" ^^ {_ => MergeDeleteClause}
  lazy val mergeUpdateClause: Parser[MergeUpdateOrDelete] =
    "update" ~> "set" ~> rep1sep(mergeUpdateItem, comma) ^^ MergeUpdateClause

  lazy val mergeUpdateItem: Parser[(ColumnExpression, Expression)] =
    columnExpr ~ ("=" ~> expr) ^^ {case a~b => (a,b)}

  lazy val matchedClause: Parser[MergeWhenClause] =
    ("when" ~> "matched" ~> opt("and" ~> expr)) ~
    ("then" ~> (mergeUpdateClause | mergeDeleteClause)) ^^ {
      case a ~ b=>
        MergeMatchedClause(a,b)
    }

  lazy val mergeInputValues: Parser[List[Expression]] =
    "values" ~> lp ~> rep1sep(expr, comma) <~ rp

  lazy val mergeInsertClause: Parser[MergeInsertClause] =
    "insert" ~> (opt(columnList) ~ mergeInputValues) ^^ {
      case a~b => MergeInsertClause(a,b)}

  lazy val whenNotMatched: Parser[String] =
    "when" ~> "not" ~> "matched"

  lazy val notMatchedByTargetClause: Parser[MergeWhenClause] =
    whenNotMatched ~>
    opt("by" ~ kw("target")) ~>
    opt("and" ~> expr) ~
    ("then" ~> mergeInsertClause) ^^ {
      case a~b =>
        MergeNotMatchedByTargetClause(a,b)
    }

  lazy val notMatchedBySourceClause: Parser[MergeWhenClause] =
    whenNotMatched ~>
    opt("by" ~> kw("source")) ~>
    opt("and" ~> expr) ~
    ("then" ~> (mergeUpdateClause | mergeDeleteClause)) ^^ {
      case a ~ b =>
        MergeNotMatchedBySourceClause(a,b)
    }

  lazy val merge: Parser[MergeStatement] = {
    ("merge" ~> opt("into") ~> insertRelation) ~
    ("using" ~> mergeRelation) ~
    ("on" ~> expr) ~
    mergeWhenClause ^^ {
      case a ~ b ~ c ~ d =>
        Merge(a,b,c,d)
    }
  }

  def pos[T <: SQL](p: => Parser[T]): Parser[T] = {
    def parseFn(in: Input): ParseResult[T] =
      p(in) match {
        case Success(t, in1) =>
          Success(t.setPos(in.offset), in1)
        case fail: NoSuccess =>
          fail
      }
    Parser(parseFn)
  }

  def parse[T<:SQL](p: Parser[T], sql: String): Either[Err,T] = {
    phrase(p)(new lexical.Scanner(sql)) match {
      case Success(stmt, _) =>
        Right(stmt)
      case NoSuccess(msg, rest) =>
        val msg1 = msg match {
          case "end of input expected" =>
            "end of statement expected"
          case x =>
            val context = 80
            val contextStart = math.max(0, rest.offset - context)
            val contextEnd = rest.offset + math.min(context, rest.source.length() - rest.offset)
            val before = rest.source.subSequence(contextStart, rest.offset)
            val after = rest.source.subSequence(rest.offset, contextEnd)
            s"[*] Parsing error: $x at ${rest.offset}\n\n\n$before[*]$after\n\n"
        }
        Left(ParsingError(msg1, rest.offset))
    }
  }

  def parseStatement(sql: String): Either[Err, Statement] = {
    parse(statement <~ opt(";"), sql)
  }

}
