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

package com.google.cloud.pso

import com.google.cloud.pso.sql.ast.Literals._
import com.google.cloud.pso.sql.ast.TypeLiteral

package object sql {
  type Operators = Set[String]

  /** https://cloud.google.com/bigquery/docs/reference/standard-sql/functions-and-operators */
  object BQFunctions {
    val Aggregate = Set(
      "ANY_VALUE",
      "ARRAY_AGG",
      "ARRAY_CONCAT_AGG",
      "AVG",
      "BIT_AND",
      "BIT_OR",
      "BIT_XOR",
      "COUNT",
      "COUNTIF",
      "LOGICAL_AND",
      "LOGICAL_OR",
      "MAX",
      "MIN",
      "STRING_AGG",
      "SUM"
    )
    val StatisticalAggregate = Set(
      "CORR",
      "COVAR_POP",
      "COVAR_SAMP",
      "STDDEV_POP",
      "STDDEV_SAMP",
      "STDDEV",
      "VAR_POP",
      "VAR_SAMP",
      "VARIANCE"
    )
    val ApproximateAggregate = Set(
      "APPROX_COUNT_DISTINCT",
      "APPROX_QUANTILES",
      "APPROX_TOP_COUNT",
      "APPROX_TOP_SUM"
    )
    val HyperLogLog = Set(
      "HLL_COUNT.INIT",
      "HLL_COUNT.MERGE",
      "HLL_COUNT.MERGE_PARTIAL",
      "HLL_COUNT.EXTRACT"
    )
    val Numbering = Set(
      "RANK",
      "DENSE_RANK",
      "PERCENT_RANK",
      "CUME_DIST",
      "NTILE",
      "ROW_NUMBER"
    )
    val Bit = Set(
      "BIT_COUNT"
    )
    val Mathematical = Set(
      "ABS",
      "SIGN",
      "IS_INF",
      "IS_NAN",
      "IEEE_DIVIDE",
      "RAND",
      "SQRT",
      "POW",
      "POWER",
      "EXP",
      "LN",
      "LOG",
      "LOG10",
      "GREATEST",
      "LEAST",
      "DIV",
      "SAFE_DIVIDE",
      "MOD",
      "ROUND",
      "TRUNC",
      "CEIL",
      "CEILING",
      "FLOOR",
      "COS",
      "COSH",
      "ACOS",
      "ACOSH",
      "SIN",
      "SINH",
      "ASIN",
      "ASINH",
      "TAN",
      "TANH",
      "ATAN",
      "ATANH",
      "ATAN2"
    )
    val Navigation = Set(
      "FIRST_VALUE",
      "LAST_VALUE",
      "NTH_VALUE",
      "LEAD",
      "LAG",
      "PERCENTILE_CONT",
      "PERCENTILE_DISC",
      "Aggregate Analytic Functions"
    )
    val Hash = Set(
      "FARM_FINGERPRINT",
      "MD5",
      "SHA1",
      "SHA256",
      "SHA512"
    )
    val String = Set(
      "BYTE_LENGTH",
      "CHAR_LENGTH",
      "CHARACTER_LENGTH",
      "CODE_POINTS_TO_BYTES",
      "CODE_POINTS_TO_STRING",
      "CONCAT",
      "ENDS_WITH",
      "FORMAT",
      "FROM_BASE32",
      "FROM_BASE64",
      "FROM_HEX",
      "LENGTH",
      "LPAD",
      "LOWER",
      "LTRIM",
      "NORMALIZE",
      "NORMALIZE_AND_CASEFOLD",
      "REGEXP_CONTAINS",
      "REGEXP_EXTRACT",
      "REGEXP_EXTRACT_ALL",
      "REGEXP_REPLACE",
      "REPLACE",
      "REPEAT",
      "REVERSE",
      "RPAD",
      "RTRIM",
      "SAFE_CONVERT_BYTES_TO_STRING",
      "SPLIT",
      "STARTS_WITH",
      "STRPOS",
      "SUBSTR",
      "TO_BASE32",
      "TO_BASE64",
      "TO_CODE_POINTS",
      "TO_HEX",
      "TRIM",
      "UPPER"
    )
    val Json = Set(
      "JSON_EXTRACT",
      "JSON_EXTRACT_SCALAR",
      "TO_JSON_STRING"
    )
    val Array = Set(
      "ARRAY",
      "ARRAY_CONCAT",
      "ARRAY_LENGTH",
      "ARRAY_TO_STRING",
      "GENERATE_ARRAY",
      "GENERATE_DATE_ARRAY",
      "GENERATE_TIMESTAMP_ARRAY",
      "OFFSET",
      "ORDINAL",
      "ARRAY_REVERSE",
      "SAFE_OFFSET",
      "SAFE_ORDINAL"
    )
    val Date = Set(
      "CURRENT_DATE",
      "EXTRACT",
      "DATE",
      "DATE_ADD",
      "DATE_SUB",
      "DATE_DIFF",
      "DATE_TRUNC",
      "DATE_FROM_UNIX_DATE",
      "FORMAT_DATE",
      "PARSE_DATE",
      "UNIX_DATE"
      //"Supported Format Elements for DATE",
    )
    val DateTime = Set(
      "CURRENT_DATETIME",
      "DATETIME",
      "DATETIME_ADD",
      "DATETIME_SUB",
      "DATETIME_DIFF",
      "DATETIME_TRUNC",
      "FORMAT_DATETIME",
      "PARSE_DATETIME"
      //"Supported format elements for DATETIME",
    )
    val Time = Set(
      "CURRENT_TIME",
      "TIME",
      "TIME_ADD",
      "TIME_SUB",
      "TIME_DIFF",
      "TIME_TRUNC",
      "FORMAT_TIME",
      "PARSE_TIME"
      //"Supported format elements for TIME"
    )
    val Timestamp = Set(
      "CURRENT_TIMESTAMP",
      "EXTRACT",
      "STRING",
      "TIMESTAMP",
      "TIMESTAMP_ADD",
      "TIMESTAMP_SUB",
      "TIMESTAMP_DIFF",
      "TIMESTAMP_TRUNC",
      "FORMAT_TIMESTAMP",
      "PARSE_TIMESTAMP",
      "TIMESTAMP_SECONDS",
      "TIMESTAMP_MILLIS",
      "TIMESTAMP_MICROS",
      "UNIX_SECONDS",
      "UNIX_MILLIS",
      "UNIX_MICROS"
    )
    // "Supported format elements for TIMESTAMP"
    // "Timezone definitions"
    val Geography = Set(
      "ST_GEOGPOINT",
      "ST_MAKELINE",
      "ST_MAKEPOLYGON",
      "ST_MAKEPOLYGONORIENTED",
      "ST_GEOGFROMGEOJSON",
      "ST_GEOGFROMTEXT",
      "ST_GEOGFROMWKB",
      "ST_ASGEOJSON",
      "ST_ASTEXT",
      "ST_ASBINARY",
      "ST_BOUNDARY",
      "ST_CENTROID",
      "ST_CLOSESTPOINT",
      "ST_DIFFERENCE",
      "ST_INTERSECTION",
      "ST_SNAPTOGRID",
      "ST_UNION",
      "ST_X",
      "ST_Y",
      "ST_CONTAINS",
      "ST_COVEREDBY",
      "ST_COVERS",
      "ST_DISJOINT",
      "ST_DWITHIN",
      "ST_EQUALS",
      "ST_INTERSECTS",
      "ST_INTERSECTSBOX",
      "ST_TOUCHES",
      "ST_WITHIN",
      "ST_ISEMPTY",
      "ST_ISCOLLECTION",
      "ST_DIMENSION",
      "ST_NUMPOINTS",
      "ST_AREA",
      "ST_DISTANCE",
      "ST_LENGTH",
      "ST_MAXDISTANCE",
      "ST_PERIMETER",
      "ST_UNION_AGG"
    )
    val Security = Set(
      "SESSION_USER",
      "UUID functions",
      "GENERATE_UUID"
    )
    val Net = Set(
      "NET.IP_FROM_STRING",
      "NET.SAFE_IP_FROM_STRING",
      "NET.IP_TO_STRING",
      "NET.IP_NET_MASK",
      "NET.IP_TRUNC",
      "NET.IPV4_FROM_INT64",
      "NET.IPV4_TO_INT64",
      "NET.HOST",
      "NET.PUBLIC_SUFFIX",
      "NET.REG_DOMAIN"
    )
    val Conditional = Set("COALESCE","IF","IFNULL","NULLIF")
    val All: Set[String] = Aggregate ++ StatisticalAggregate ++ ApproximateAggregate ++ HyperLogLog ++ Numbering ++ Bit ++ Mathematical ++ Navigation ++ Hash ++ String ++ Json ++ Array ++ Date ++ DateTime ++ Time ++ Timestamp ++ Geography ++ Security ++ Net ++ Conditional
  }

  val TeradataKeywords = Set("qualify")

  val RenameMap: Map[String,String] = Map(
    "hash_sha1" -> "sha1",
    "hash_sha256" -> "sha256",
    "hash_sha512" -> "sha512",
    "hash_md5" -> "md5"
  )

  val Keywords: Operators = Set(
    "select", "create", "insert", "update", "delete", "merge", "drop",
    "all", "and", "as", "asc", "between", "by", "case", "cast", "cross",
    "cube", "desc", "distinct", "else", "end", "exists", "false", "from",
    "full", "group", "grouping", "having", "in", "inner", "is", "join",
    "left", "like", "limit", "not", "null", "on", "or", "order", "outer",
    "right", "rollup",
    "sets", "then", "true", "union", "unknown",
    "when", "where", "with",
    "table", "view", "set", "into", "varchar",
    "over", "partition", "matched", "using", "values"
  ) ++ TeradataKeywords

  val CustomDelimiters: Set[String] = Set("$" , "{{", "}}")

  val Delimiters: Set[String] = Set(
    "(", ")", "\"",
    "'", "%", "&",
    "*", "/", "+",
    "-", ",", ".",
    ":", ";", "<",
    ">", "?", "[",
    "]", "_", "|",
    "=", "{", "}",
    "^", "??(", "??)",
    "<>", ">=", "<=",
    "||", "->", "=>"
  ) ++ CustomDelimiters

  val ComparisonOperators: Operators = Set("=", "<>", "<", ">", ">=", "<=")
  val LikeOperators: Operators = Set("like")
  val OrOperators: Operators = Set("or")
  val AndOperators: Operators = Set("and")
  val AdditionOperators: Operators = Set("+", "-")
  val MultiplicationOperators: Operators = Set("*", "/")
  val UnaryOperators: Operators = Set("-", "+")

  val TypeMap: Map[String, TypeLiteral] = Map(
    "timestamp" -> TimestampTypeLiteral(),
    "datetime" -> TimestampTypeLiteral(),
    "date" -> DateTypeLiteral(),
    "boolean" -> BooleanTypeLiteral,
    "varchar" -> VarcharTypeLiteral(),
    "integer" -> IntegerTypeLiteral,
    "numeric" -> NumericTypeLiteral,
    "decimal" -> DecimalTypeLiteral,
    "real" -> FloatTypeLiteral,
    "float" -> FloatTypeLiteral
  )

  // Default set of operators
  trait SQLOperators {
    val orOperators: Operators = OrOperators
    val andOperators: Operators = AndOperators
    val likeOperators: Operators = LikeOperators
    val additionOperators: Operators = AdditionOperators
    val multiplicationOperators: Operators = MultiplicationOperators
    val comparisonOperators: Operators = ComparisonOperators
    val unaryOperators: Operators = UnaryOperators
    val typeMap: Map[String,TypeLiteral] = TypeMap
  }

  trait Err {
    val msg: String
    val pos: Int

    def toString(sql: String, lineChar: Char = '~'): String = {
      val i = sql.length - sql.drop(pos).dropWhile(_.toString.matches("""\s""")).length

      sql.split('\n').foldLeft("") {
        case (s, line) if s.length <= i && (s.length + line.length) >= i =>
          val c = (1 to (i - s.length)).map(_ => lineChar).mkString + "^"
          s"$s\n$line\n$c\nError: $msg\n"

        case (s, line) =>
          s"$s\n$line"
      }
      .split('\n')
      .dropWhile(_.isEmpty).reverse
      .dropWhile(_.isEmpty).reverse
      .mkString("\n")
    }

    def combine(err: Err): Err = this
  }

  case class ParsingError(msg: String, pos: Int) extends Err
}
