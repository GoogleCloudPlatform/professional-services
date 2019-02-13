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

import org.scalatest.prop.TableDrivenPropertyChecks
import org.scalatest.{EitherValues, Matchers, PropSpec}

class FormatSQLSpec extends PropSpec with Matchers with EitherValues {

  val examples = TableDrivenPropertyChecks.Table(
    ("Input SQL", "Formatted SQL"),

    (
      """SELECT 1""",
      """
        |SELECT
        |  1
      """.stripMargin
    ),

    (
      """select district, sum(population) from city""",
      """
        |SELECT
        |  district,
        |  SUM(population)
        |FROM
        |  city
      """.stripMargin
    ),

    (
      """select * from City as v join Country as p on v.country_id = p.country_id where city.name like ? AND population > 10000""",
      """
        |SELECT
        |  *
        |FROM
        |  city AS v
        |  JOIN country AS p
        |    ON v.country_id = p.country_id
        |WHERE
        |  city.name LIKE ?
        |  AND population > 10000
      """.stripMargin
    ),

    (
      """select case when a =b then 1 when b <> 2 then 2 else 0 end""",
      """
        |SELECT
        |  CASE
        |    WHEN a = b THEN 1
        |    WHEN b <> 2 THEN 2
        |    ELSE 0
        |  END
      """.stripMargin
    ),

    (
      """select 1,2 union all select 3,4 union all select 5,6""",
      """
        |SELECT
        |  1,
        |  2
        |UNION ALL
        |SELECT
        |  3,
        |  4
        |UNION ALL
        |SELECT
        |  5,
        |  6
      """.stripMargin
    ),

    (
      """select count(distinct woot)""",
      """
        |SELECT
        |  COUNT(DISTINCT woot)
      """.stripMargin
    ),

    (
      """SELECT 1 LIMIT 10""",
      """
        |SELECT
        |  1
        |LIMIT 10
      """.stripMargin
    )
  )

  // --

  property("print SQL") {
    TableDrivenPropertyChecks.forAll(examples) {
      case (sql, expectedSQL) =>
        (new StandardSQLParser).parseStatement(sql)
          .fold(e => sys.error(s"\n\n${e.toString(sql)}\n"), identity).print() should be(expectedSQL.stripMargin.trim)
    }
  }

}