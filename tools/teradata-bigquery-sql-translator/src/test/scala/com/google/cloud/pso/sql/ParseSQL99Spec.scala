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

import com.google.cloud.pso.sql.ast.Expressions.{CountStarExpression, SetDistinct, SortASC, _}
import com.google.cloud.pso.sql.ast.Identifiers._
import com.google.cloud.pso.sql.ast.Joins._
import com.google.cloud.pso.sql.ast.Literals._
import com.google.cloud.pso.sql.ast.Projections._
import com.google.cloud.pso.sql.ast.Relations._
import com.google.cloud.pso.sql.ast.Statements._
import org.scalatest.prop.TableDrivenPropertyChecks
import org.scalatest.{EitherValues, Matchers, PropSpec}

class ParseSQL99Spec extends PropSpec with Matchers with EitherValues with TableDrivenPropertyChecks {

  val validSQL99SelectStatements = Table(
    ("SQL", "Expected AST"),

    (
      """SELECT *""", Select(
      projections = List(
        AllColumns
      )
    )),

    (
      """select *, Customers.*""", Select(
      projections = List(
        AllColumns,
        AllTableColumns(TableSpec("Customers"))
      )
    )),

    (
      """Select 1""", Select(
      projections = List(
        ExpressionProjection(
          LiteralExpression(IntegerLiteral(1))
        )
      )
    )),

    (
      """select 1 as 'toto'""", Select(
      projections = List(
        ExpressionProjection(
          LiteralExpression(IntegerLiteral(1)),
          alias = Some("toto")
        )
      )
    )),

    (
      """SELECT 3.14 AS PI""", Select(
      projections = List(
        ExpressionProjection(
          LiteralExpression(DecimalLiteral(3.14)),
          alias = Some("PI")
        )
      )
    )),

    (
      """SELECT 1e-8""", Select(
      projections = List(
        ExpressionProjection(
          LiteralExpression(DecimalLiteral(1e-8)),
          alias = None
        )
      )
    )),

    (
      """SELECT 1.""", Select(
      projections = List(
        ExpressionProjection(
          LiteralExpression(DecimalLiteral(1.0)),
          alias = None
        )
      )
    )),

    (
      """SELECT .1""", Select(
      projections = List(
        ExpressionProjection(
          LiteralExpression(DecimalLiteral(.1)),
          alias = None
        )
      )
    )),

    (
      """SELECT .1e2""", Select(
      projections = List(
        ExpressionProjection(
          LiteralExpression(DecimalLiteral(.1e2)),
          alias = None
        )
      )
    )),

    (
      """SELECT 1.0E-8""", Select(
      projections = List(
        ExpressionProjection(
          LiteralExpression(DecimalLiteral(1.0E-8)),
          alias = None
        )
      )
    )),

    (
      """select null""", Select(
      projections = List(
        ExpressionProjection(
          LiteralExpression(NullLiteral)
        )
      )
    )),

    (
      """select NULL as kiki""", Select(
      projections = List(
        ExpressionProjection(
          LiteralExpression(NullLiteral),
          alias = Some("kiki")
        )
      )
    )),

    (
      """select name""", Select(
      projections = List(
        ExpressionProjection(
          ColumnExpression(ColumnIdent("name", None))
        )
      )
    )),

    (
      """select name as Nom""", Select(
      projections = List(
        ExpressionProjection(
          ColumnExpression(ColumnIdent("name", None)),
          alias = Some("Nom")
        )
      )
    )),

    (
      """select Customers.name as Nom""", Select(
      projections = List(
        ExpressionProjection(
          ColumnExpression(ColumnIdent("name", Some(TableSpec("Customers")))),
          alias = Some("Nom")
        )
      )
    )),

    (
      """select test.Customers.name as Nom""", Select(
      projections = List(
        ExpressionProjection(
          ColumnExpression(ColumnIdent("name", Some(TableSpec("Customers", Some("test"))))),
          alias = Some("Nom")
        )
      )
    )),

    (
      """select (test.Customers.name) as Nom""", Select(
      projections = List(
        ExpressionProjection(
          ParenExpression(
            ColumnExpression(ColumnIdent("name", Some(TableSpec("Customers", Some("test")))))
          ),
          alias = Some("Nom")
        )
      )
    )),

    (
      """Select "Kiki", 'Coco'""", Select(
      projections = List(
        ExpressionProjection(
          ColumnExpression(ColumnIdent("Kiki"))
        ),
        ExpressionProjection(
          LiteralExpression(StringLiteral("Coco"))
        )
      )
    )),

    (
      """Select 'L''assiette'""", Select(
      projections = List(
        ExpressionProjection(
          LiteralExpression(StringLiteral("L'assiette"))
        )
      )
    )),

    (
      """Select "An interesting ""column"""""", Select(
      projections = List(
        ExpressionProjection(
          ColumnExpression(ColumnIdent("""An interesting "column""""))
        )
      )
    )),

    (
      """Select 'Kiki' as name, "Coco" as firstname""", Select(
      projections = List(
        ExpressionProjection(
          LiteralExpression(StringLiteral("Kiki")),
          alias = Some("name")
        ),
        ExpressionProjection(
          ColumnExpression(ColumnIdent("Coco")),
          alias = Some("firstname")
        )
      )
    )),

    (
      """Select 1 + 3""", Select(
      projections = List(
        ExpressionProjection(
          MathExpression(
            "+",
            LiteralExpression(IntegerLiteral(1)),
            LiteralExpression(IntegerLiteral(3))
          )
        )
      )
    )),

    (
      """Select 2 * 5""", Select(
      projections = List(
        ExpressionProjection(
          MathExpression(
            "*",
            LiteralExpression(IntegerLiteral(2)),
            LiteralExpression(IntegerLiteral(5))
          )
        )
      )
    )),

    (
      """Select 8 + 2 * -5""", Select(
      projections = List(
        ExpressionProjection(
          MathExpression(
            "+",
            LiteralExpression(IntegerLiteral(8)),
            MathExpression(
              "*",
              LiteralExpression(IntegerLiteral(2)),
              UnaryMathExpression(
                "-",
                LiteralExpression(IntegerLiteral(5))
              )
            )
          )
        )
      )
    )),

    (
      """Select(8 + 2) * 5""", Select(
      projections = List(
        ExpressionProjection(
          MathExpression(
            "*",
            ParenExpression(
              MathExpression(
                "+",
                LiteralExpression(IntegerLiteral(8)),
                LiteralExpression(IntegerLiteral(2))
              )
            ),
            LiteralExpression(IntegerLiteral(5))
          )
        )
      )
    )),

    (
      """Select *, -8 + (2 * 5) as YO, (test.Persons.PersonId + 7);""", Select(
      projections = List(
        AllColumns,
        ExpressionProjection(
          MathExpression(
            "+",
            UnaryMathExpression(
              "-",
              LiteralExpression(IntegerLiteral(8))
            ),
            ParenExpression(
              MathExpression(
                "*",
                LiteralExpression(IntegerLiteral(2)),
                LiteralExpression(IntegerLiteral(5))
              )
            )
          ),
          alias = Some("YO")
        ),
        ExpressionProjection(
          ParenExpression(
            MathExpression(
              "+",
              ColumnExpression(ColumnIdent("PersonId", Some(TableSpec("Persons", Some("test"))))),
              LiteralExpression(IntegerLiteral(7))
            )
          )
        )
      )
    )),

    (
      """Select 5 > 1""", Select(
      projections = List(
        ExpressionProjection(
          ComparisonExpression(
            ">",
            LiteralExpression(IntegerLiteral(5)),
            LiteralExpression(IntegerLiteral(1))
          )
        )
      )
    )),

    (
      """Select 5 > 1 + 10""", Select(
      projections = List(
        ExpressionProjection(
          ComparisonExpression(
            ">",
            LiteralExpression(IntegerLiteral(5)),
            MathExpression(
              "+",
              LiteralExpression(IntegerLiteral(1)),
              LiteralExpression(IntegerLiteral(10))
            )
          )
        )
      )
    )),

    (
      """Select 1 > 0 and 2 - 2 as woot ;""", Select(
      projections = List(
        ExpressionProjection(
          AndExpression(
            "and",
            ComparisonExpression(
              ">",
              LiteralExpression(IntegerLiteral(1)),
              LiteralExpression(IntegerLiteral(0))
            ),
            MathExpression(
              "-",
              LiteralExpression(IntegerLiteral(2)),
              LiteralExpression(IntegerLiteral(2))
            )
          ),
          alias = Some("woot")
        )
      )
    )),

    (
      """select max(age), min(age)""", Select(
      projections = List(
        ExpressionProjection(
          FunctionCallExpression("max", None, args = List(
            ColumnExpression(ColumnIdent("age", None))
          ))
        ),
        ExpressionProjection(
          FunctionCallExpression("min", None, args = List(
            ColumnExpression(ColumnIdent("age", None))
          ))
        )
      )
    )),

    (
      """select max(age)/min(age)""", Select(
      projections = List(
        ExpressionProjection(
          MathExpression(
            "/",
            FunctionCallExpression("max", None, args = List(
              ColumnExpression(ColumnIdent("age", None))
            )),
            FunctionCallExpression("min", None, args = List(
              ColumnExpression(ColumnIdent("age", None))
            ))
          )
        )
      )
    )),

    (
      """select count(distinct x)""", Select(
      projections = List(
        ExpressionProjection(
          FunctionCallExpression("count", Some(SetDistinct), args = List(
            ColumnExpression(ColumnIdent("x", None))
          ))
        )
      )
    )),

    (
      """select (bam in (8)) in ('Youhou', 2, null, 4 > 7) as plop""", Select(
      projections = List(
        ExpressionProjection(
          IsInExpression(
            ParenExpression(
              IsInExpression(
                ColumnExpression(ColumnIdent("bam", None)),
                not = false,
                List(
                  LiteralExpression(IntegerLiteral(8))
                )
              )
            ),
            not = false,
            List(
              LiteralExpression(StringLiteral("Youhou")),
              LiteralExpression(IntegerLiteral(2)),
              LiteralExpression(NullLiteral),
              ComparisonExpression(
                ">",
                LiteralExpression(IntegerLiteral(4)),
                LiteralExpression(IntegerLiteral(7))
              )
            )
          ),
          alias = Some("plop")
        )
      )
    )),

    (
      """SELECT 'b' BETWEEN 'a' AND 'c'""", Select(
      projections = List(
        ExpressionProjection(
          IsBetweenExpression(
            LiteralExpression(StringLiteral("b")),
            not = false,
            (
              LiteralExpression(StringLiteral("a")) ->
                LiteralExpression(StringLiteral("c"))
              )
          )
        )
      )
    )),

    (
      """SELECT 15 BETWEEN 3 + 7 AND Min(999) and 'b' BETWEEN 'a' AND 'c' as woot, xxx""", Select(
      projections = List(
        ExpressionProjection(
          AndExpression(
            "and",
            IsBetweenExpression(
              LiteralExpression(IntegerLiteral(15)),
              not = false,
              (
                MathExpression(
                  "+",
                  LiteralExpression(IntegerLiteral(3)),
                  LiteralExpression(IntegerLiteral(7))
                ) ->
                  FunctionCallExpression("min", None, args = List(
                    LiteralExpression(IntegerLiteral(999))
                  ))
                )
            ),
            IsBetweenExpression(
              LiteralExpression(StringLiteral("b")),
              not = false,
              (
                LiteralExpression(StringLiteral("a")) ->
                  LiteralExpression(StringLiteral("c"))
                )
            )
          ),
          alias = Some("woot")
        ),
        ExpressionProjection(
          ColumnExpression(ColumnIdent("xxx", None))
        )
      )
    )),

    (
      """Select 1 BETWEEN 0 AND 4 > 2""", Select(
      projections = List(
        ExpressionProjection(
          ComparisonExpression(
            ">",
            IsBetweenExpression(
              LiteralExpression(IntegerLiteral(1)),
              not = false,
              (
                LiteralExpression(IntegerLiteral(0)),
                LiteralExpression(IntegerLiteral(4))
              )
            ),
            LiteralExpression(IntegerLiteral(2))
          )
        )
      )
    )),

    (
      """select not 1""", Select(
      projections = List(
        ExpressionProjection(
          NotExpression(
            LiteralExpression(IntegerLiteral(1))
          )
        )
      )
    )),

    (
      """select not 3 + 3 as zero""", Select(
      projections = List(
        ExpressionProjection(
          NotExpression(
            MathExpression(
              "+",
              LiteralExpression(IntegerLiteral(3)),
              LiteralExpression(IntegerLiteral(3))
            )
          ),
          alias = Some("zero")
        )
      )
    )),

    (
      """select not 5 > 3""", Select(
      projections = List(
        ExpressionProjection(
          NotExpression(
            ComparisonExpression(
              ">",
              LiteralExpression(IntegerLiteral(5)),
              LiteralExpression(IntegerLiteral(3))
            )
          )
        )
      )
    )),

    (
      """select 3 not in (1,2,3)""", Select(
      projections = List(
        ExpressionProjection(
          IsInExpression(
            LiteralExpression(IntegerLiteral(3)),
            not = true,
            List(
              LiteralExpression(IntegerLiteral(1)),
              LiteralExpression(IntegerLiteral(2)),
              LiteralExpression(IntegerLiteral(3))
            )
          )
        )
      )
    )),

    (
      """select 1 not BETWEEN 0 and 10""", Select(
      projections = List(
        ExpressionProjection(
          IsBetweenExpression(
            LiteralExpression(IntegerLiteral(1)),
            not = true,
            (
              LiteralExpression(IntegerLiteral(0)),
              LiteralExpression(IntegerLiteral(10))
            )
          )
        )
      )
    )),

    (
      """select 2 between (3 not between 4 and 'a' in ('a', 'b', 'c')) and 10""", Select(
      projections = List(
        ExpressionProjection(
          IsBetweenExpression(
            LiteralExpression(IntegerLiteral(2)),
            not = false,
            (
              ParenExpression(
                IsBetweenExpression(
                  LiteralExpression(IntegerLiteral(3)),
                  not = true,
                  (
                    LiteralExpression(IntegerLiteral(4)),
                    IsInExpression(
                      LiteralExpression(StringLiteral("a")),
                      not = false,
                      List(
                        LiteralExpression(StringLiteral("a")),
                        LiteralExpression(StringLiteral("b")),
                        LiteralExpression(StringLiteral("c"))
                      )
                    )
                  )
                )
              ),
              LiteralExpression(IntegerLiteral(10))
            )
          )
        )
      )
    )),

    (
      """select 1 is true""", Select(
      projections = List(
        ExpressionProjection(
          IsExpression(
            LiteralExpression(IntegerLiteral(1)),
            not = false,
            TrueLiteral
          )
        )
      )
    )),

    (
      """select 1 is not false""", Select(
      projections = List(
        ExpressionProjection(
          IsExpression(
            LiteralExpression(IntegerLiteral(1)),
            not = true,
            FalseLiteral
          )
        )
      )
    )),

    (
      """select not 1 is not unknown""", Select(
      projections = List(
        ExpressionProjection(
          NotExpression(
            IsExpression(
              LiteralExpression(IntegerLiteral(1)),
              not = true,
              UnknownLiteral
            )
          )
        )
      )
    )),

    (
      """SELECT -(1 + 2)""", Select(
      projections = List(
        ExpressionProjection(
          UnaryMathExpression(
            "-",
            ParenExpression(
              MathExpression(
                "+",
                LiteralExpression(IntegerLiteral(1)),
                LiteralExpression(IntegerLiteral(2))
              )
            )
          )
        )
      )
    )),

    (
      """SELECT -1 + 2""", Select(
      projections = List(
        ExpressionProjection(
          MathExpression(
            "+",
            UnaryMathExpression(
              "-",
              LiteralExpression(IntegerLiteral(1))
            ),
            LiteralExpression(IntegerLiteral(2))
          )
        )
      )
    )),

    (
      """SELECT - 1 + 2""", Select(
      projections = List(
        ExpressionProjection(
          MathExpression(
            "+",
            UnaryMathExpression(
              "-",
              LiteralExpression(IntegerLiteral(1))
            ),
            LiteralExpression(IntegerLiteral(2))
          )
        )
      )
    )),

    (
      """SELECT - 1 - 2""", Select(
      projections = List(
        ExpressionProjection(
          MathExpression(
            "-",
            UnaryMathExpression(
              "-",
              LiteralExpression(IntegerLiteral(1))
            ),
            LiteralExpression(IntegerLiteral(2))
          )
        )
      )
    )),

    (
      """Select 8 / (- 1 + 1) as "BAM!!!";""", Select(
      projections = List(
        ExpressionProjection(
          MathExpression(
            "/",
            LiteralExpression(IntegerLiteral(8)),
            ParenExpression(
              MathExpression(
                "+",
                UnaryMathExpression(
                  "-",
                  LiteralExpression(IntegerLiteral(1))
                ),
                LiteralExpression(IntegerLiteral(1))
              )
            )
          ),
          alias = Some("BAM!!!")
        )
      )
    )),

    (
      """select (select 1 + 2) as '(select 1 + 2)'""", Select(
      projections = List(
        ExpressionProjection(
          SubSelectExpression(
            Select(
              projections = List(
                ExpressionProjection(
                  MathExpression(
                    "+",
                    LiteralExpression(IntegerLiteral(1)),
                    LiteralExpression(IntegerLiteral(2))
                  )
                )
              )
            )
          ),
          alias = Some("(select 1 + 2)")
        )
      )
    )),

    (
      """select case x when 1 then 2 when 3 then 5 else 0 end""", Select(
      projections = List(
        ExpressionProjection(
          CaseWhenExpression(
            value = Some(ColumnExpression(ColumnIdent("x"))),
            mapping = List(
              (LiteralExpression(IntegerLiteral(1)), LiteralExpression(IntegerLiteral(2))),
              (LiteralExpression(IntegerLiteral(3)), LiteralExpression(IntegerLiteral(5)))
            ),
            elseVal = Some(LiteralExpression(IntegerLiteral(0)))
          )
        )
      )
    )),

    (
      """select case when (a = b) then 'foo' end""", Select(
      projections = List(
        ExpressionProjection(
          CaseWhenExpression(
            value = None,
            mapping = List(
              (ParenExpression(ComparisonExpression("=", ColumnExpression(ColumnIdent("a")), ColumnExpression(ColumnIdent("b")))),
                LiteralExpression(StringLiteral("foo")))
            ),
            elseVal = None
          )
        )
      )
    )),

    (
      """select exists (select null)""", Select(
      projections = List(
        ExpressionProjection(
          ExistsExpression(
            Select(
              projections = List(
                ExpressionProjection(
                  LiteralExpression(NullLiteral)
                )
              )
            )
          )
        )
      )
    )),

    (
      """select not exists (select null)""", Select(
      projections = List(
        ExpressionProjection(
          NotExpression(
            ExistsExpression(
              Select(
                projections = List(
                  ExpressionProjection(
                    LiteralExpression(NullLiteral)
                  )
                )
              )
            )
          )
        )
      )
    )),

    (
      """select not not exists (select null)""", Select(
      projections = List(
        ExpressionProjection(
          NotExpression(
            NotExpression(
              ExistsExpression(
                Select(
                  projections = List(
                    ExpressionProjection(
                      LiteralExpression(NullLiteral)
                    )
                  )
                )
              )
            )
          )
        )
      )
    )),

    (
      """select * from country, city""", Select(
      projections = List(
        AllColumns
      ),
      relations = List(
        SingleTableRelation(TableSpec("country")),
        SingleTableRelation(TableSpec("city"))
      )
    )),

    (
      """select * from sakila.city as villes""", Select(
      projections = List(
        AllColumns
      ),
      relations = List(
        SingleTableRelation(TableSpec("city", Some("sakila")), alias = Some("villes"))
      )
    )),

    (
      """select * from city villes""", Select(
      projections = List(
        AllColumns
      ),
      relations = List(
        SingleTableRelation(TableSpec("city"), alias = Some("villes"))
      )
    )),

    (
      """select * from (select 1) stuff""", Select(
      projections = List(
        AllColumns
      ),
      relations = List(
        SubSelectRelation(
          Select(
            projections = List(
              ExpressionProjection(
                LiteralExpression(IntegerLiteral(1))
              )
            )
          ),
          alias = "stuff"
        )
      )
    )),

    (
      """select * from City join Country""", Select(
      projections = List(
        AllColumns
      ),
      relations = List(
        JoinRelation(
          SingleTableRelation(TableSpec("City")),
          InnerJoin,
          SingleTableRelation(TableSpec("Country"))
        )
      )
    )),

    (
      """select * from City as v join Country as p on v.country_id = p.country_id""", Select(
      projections = List(
        AllColumns
      ),
      relations = List(
        JoinRelation(
          SingleTableRelation(TableSpec("City"), alias = Some("v")),
          InnerJoin,
          SingleTableRelation(TableSpec("Country"), alias = Some("p")),
          on = Some(
            ComparisonExpression(
              "=",
              ColumnExpression(ColumnIdent("country_id", Some(TableSpec("v")))),
              ColumnExpression(ColumnIdent("country_id", Some(TableSpec("p"))))
            )
          )
        )
      )
    )),

    (
      """select district, sum(population) from city group by district having sum(population) > 10""", Select(
      projections = List(
        ExpressionProjection(
          ColumnExpression(ColumnIdent("district"))
        ),
        ExpressionProjection(
          FunctionCallExpression("sum", None, args = List(
            ColumnExpression(ColumnIdent("population"))
          ))
        )
      ),
      relations = List(
        SingleTableRelation(TableSpec("city"))
      ),
      groupBy = List(
        GroupByExpression(
          ColumnExpression(ColumnIdent("district"))
        )
      ),
      having = Some(
        ComparisonExpression(
          ">",
          FunctionCallExpression("sum", None, args = List(
            ColumnExpression(ColumnIdent("population"))
          )),
          LiteralExpression(IntegerLiteral(10))
        )
      )
    )),

    (
      """select CAST(12 as VARCHAR)""", Select(
      projections = List(
        ExpressionProjection(
          CastExpression(
            from = LiteralExpression(IntegerLiteral(12)),
            to = VarcharTypeLiteral()
          )
        )
      )
    )),

    (
      """SELECT DISTINCT device_id as id FROM wopr.dim_device ORDER BY device_name ASC""", Select(
      distinct = Some(SetDistinct),
      projections = List(
        ExpressionProjection(
          ColumnExpression(ColumnIdent("device_id", None)),
          Some("id")
        )
      ),
      relations = List(
        SingleTableRelation(
          TableSpec("dim_device", Some("wopr"))
        )
      ),
      orderBy = List(
        SortExpression(
          ColumnExpression(ColumnIdent("device_name", None)),
          Some(SortASC)
        )
      )
    )),

    (
      """SELECT 1 UNION SELECT 2""", SelectUnion(
      Select(
        projections = List(
          ExpressionProjection(
            LiteralExpression(IntegerLiteral(1)),
            None
          )
        )
      ),
      None,
      Select(
        projections = List(
          ExpressionProjection(
            LiteralExpression(IntegerLiteral(2)),
            None
          )
        )
      )
    )),

    (
      """SELECT a, b FROM (SELECT 1 a, 2 b UNION SELECT 3 a, 4 b) x""", Select(
      projections = List(
        ExpressionProjection(
          ColumnExpression(ColumnIdent("a")),
          None
        ),
        ExpressionProjection(
          ColumnExpression(ColumnIdent("b")),
          None
        )
      ),
      relations = List(
        SubSelectRelation(
          SelectUnion(
            Select(
              projections = List(
                ExpressionProjection(
                  LiteralExpression(IntegerLiteral(1)),
                  Some("a")
                ),
                ExpressionProjection(
                  LiteralExpression(IntegerLiteral(2)),
                  Some("b")
                )
              )
            ),
            None,
            Select(
              projections = List(
                ExpressionProjection(
                  LiteralExpression(IntegerLiteral(3)),
                  Some("a")
                ),
                ExpressionProjection(
                  LiteralExpression(IntegerLiteral(4)),
                  Some("b")
                )
              )
            )
          ),
          "x"
        )
      )
    )),

    (
      """SELECT a NOT LIKE 'woot%', b LIKE a""", Select(
      projections = List(
        ExpressionProjection(
          LikeExpression(
            ColumnExpression(ColumnIdent("a", None)),
            not = true,
            "like",
            LiteralExpression(StringLiteral("woot%"))
          ),
          None
        ),
        ExpressionProjection(
          LikeExpression(
            ColumnExpression(ColumnIdent("b", None)),
            not = false,
            "like",
            ColumnExpression(ColumnIdent("a", None))
          ),
          None
        )
      )
    )),

    (
      """SELECT COUNT(*) nb""", Select(
      projections = List(
        ExpressionProjection(
          CountStarExpression,
          Some("nb")
        )
      )
    )),

    (
      """select * from country limit 10""", Select(
      projections = List(
        AllColumns
      ),
      relations = List(
        SingleTableRelation(TableSpec("country"))
      ),
      limit = Some(IntegerLiteral(10))
    ))

  )

  // --

  property("parse SQL-99 SELECT statements") {
    forAll(validSQL99SelectStatements) {
      case (sql, expectedAst) =>
        (new StandardSQLParser).parseStatement(sql)
          .fold(e => sys.error(s"\n\n${e.toString(sql)}\n"), identity) should be(expectedAst)
    }
  }

}
