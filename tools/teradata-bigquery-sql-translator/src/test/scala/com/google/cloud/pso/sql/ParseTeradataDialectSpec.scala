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

import com.google.cloud.pso.sql.ast.Identifiers.{ColumnIdent, TableSpec}
import com.google.cloud.pso.sql.ast.{SQL, Statement}
import org.scalatest.FlatSpec

class ParseTeradataDialectSpec extends FlatSpec {
  val parser = new StandardSQLParser

  "TeradataParser" should "parse statement" in {
    val tc = new {
      val sql =
"""INSERT INTO DB.$TABLE_NAME (X, Y, Z)
|SELECT
|    X,
|    CASE WHEN Z='abc' THEN '123'
|         WHEN Z='xyz' THEN '456'
|         ELSE Z END AS Y,
|    Z
|FROM DB1.{{ TABLE_NAME }} B
|QUALIFY ROW_NUMBER() OVER (PARTITION BY Z ORDER BY X DESC, Y DESC) = 1
|WHERE NOT EXISTS (
|    SELECT 1
|    FROM DB.{{TABLE_NAME}} C
|    WHERE B.W = C.W);""".stripMargin
      val expected =
"""INSERT INTO db.{{ table_name }} (
|  x,
|  y,
|  z
|)
|SELECT
|  * EXCEPT qcol
|FROM
|  (
|    SELECT
|      x,
|      CASE
|        WHEN z = 'abc' THEN '123'
|        WHEN z = 'xyz' THEN '456'
|        ELSE z
|      END AS y,
|      z,
|      ROW_NUMBER() OVER (PARTITION BY z ORDER BY x DESC, y DESC) AS qcol
|    FROM
|      db1.{{ table_name }} AS b
|    WHERE
|      NOT EXISTS (
|        SELECT
|          1
|        FROM
|          db.{{ table_name }} AS c
|        WHERE
|          b.w = c.w
|      )
|  ) AS q
|WHERE
|  qcol = 1""".stripMargin
      val expectedInputs = TableSpec("{{ table_name }}", Option("DB1")) :: TableSpec("{{ table_name }}", Option("DB")) :: Nil
      val expectedOutputs = TableSpec("{{ table_name }}", Option("DB")) :: Nil
      val expectedInCols = List(ColumnIdent("X"), ColumnIdent("Z"), ColumnIdent("Y"), ColumnIdent("W", Option(TableSpec("B"))), ColumnIdent("W", Option(TableSpec("C"))))

      val expectedOutCols = List(ColumnIdent("X"), ColumnIdent("Y"), ColumnIdent("Z"))
    }
    val r3: Either[Err,Statement] = parser.parseStatement(tc.sql)

    assert(r3.isRight, r3.left.toOption.map(_.msg).getOrElse(""))
    r3 match {
      case Left(err) =>
        System.err.println(err.msg)
      case Right(stmt) =>
        assert(stmt.columnsRead == tc.expectedInCols)
        assert(stmt.columnsWritten == tc.expectedOutCols)
        assert(stmt.inputs == tc.expectedInputs)
        assert(stmt.outputs == tc.expectedOutputs)
        assert(stmt.fmt.print() == tc.expected)
    }
  }

  it should "parse qualify" in {
    val sql = "ROW_NUMBER() OVER (PARTITION BY A, B ORDER BY C DESC)"
    val expected = "ROW_NUMBER() OVER (PARTITION BY a, b ORDER BY c DESC)"
    compare(parser.partitionExpression, sql, expected)
  }

  it should "rewrite qualify" in {
    val tc = new {
      // In this scenario QUALIFY may be mistaken for a table alias
      val sql =
"""SELECT *
|FROM DB.A
|--comment
|QUALIFY ROW_NUMBER() OVER (PARTITION BY x, y ORDER BY z DESC) = 1""".stripMargin
      val expected =
"""SELECT
|  * EXCEPT qcol
|FROM
|  (
|    SELECT
|      *,
|      ROW_NUMBER() OVER (PARTITION BY x, y ORDER BY z DESC) AS qcol
|    FROM
|      db.a
|  ) AS q
|WHERE
|  qcol = 1""".stripMargin
    }
    compare(tc.sql, tc.expected)
  }

  it should "rewrite update" in {

    val f = new {
      val sql1 = """update table1 a set x = case when y = 1 then z else null end"""
      val expected1 =
        """UPDATE
          |  table1 a
          |SET
          |  x = CASE
          |    WHEN y = 1 THEN z
          |    ELSE NULL
          |  END
          |WHERE
          |  TRUE""".stripMargin

      val sql2 =
"""--this is a comment
  |UPDATE a
  |from db.table1 a,
  |	(
  |		SELECT
  |			X,
  |			MAX(Y) as Y
  |		FROM (
  |			---Forwards
  |			select
  |				cast(cast(t.x1 AS INT) AS VARCHAR(20)) || '_' || UPPER(t.x2) as X,
  |				MAX(Y) as Y
  |			FROM DB.table2 t
  |			GROUP BY 1
  |
  |			UNION
  |
  |			--example comment
  |			select
  |				cast(cast(t.x1 AS INT) AS VARCHAR(20)) || '_' || UPPER(t.x2) as X,
  |				MAX(Y1) as Y
  |			FROM DB.TABLE3 T
  |			GROUP BY 1
  |
  |			UNION
  |
  |			--example comment
  |			SELECT
  |				X1 AS X,
  |				MAX(Y2) as Y
  |			FROM DB.TABLE4
  |			WHERE Z IN (1, 2, 3)
  |			GROUP BY 1
  |
  |			UNION
  |
  |			--example comment
  |			SELECT
  |				X1 AS X,
  |				MAX(Y1) as Y
  |			FROM DB.TABLE4
  |			WHERE Z IN (1, 2, 3)
  |			GROUP BY 1
  |
  |			UNION
  |
  |			--example comment
  |			SELECT
  |				X1 AS X,
  |				MAX(Y1) as Y
  |			from DB.TABLE5
  |			GROUP BY 1
  |
  |			UNION
  |
  |			--example comment
  |			SELECT
  |				X1 AS X,
  |				MAX(Y2) as Y
  |			from DB.TABLE6
  |			GROUP BY 1
  |
  |			UNION
  |
  |			--example comment
  |			SELECT
  |				cast(cast(x1 AS INT) AS VARCHAR(20)) || '_' || UPPER(x2) as X,
  |				MAX(CAST(SUBSTRING(CAST(y1 AS CHAR(26)) FROM 1 FOR 19) AS TIMESTAMP(0))) as Y
  |			from DB2.TABLE7
  |			GROUP BY 1
  |
  |			UNION
  |
  |			-- example comment
  |			SELECT
  |				cast(cast(x1 AS INT) AS VARCHAR(20)) || '_' || UPPER(x2) as X,
  |				MAX(CAST(SUBSTRING(CAST(y1 AS CHAR(26)) FROM 1 FOR 19) AS TIMESTAMP(0))) as Y
  |			from DB2.TABLE8
  |			GROUP BY 1
  |		) interactions
  |		GROUP BY 1
  |	) b
  |set Y = CAST(SUBSTRING(CAST(b.Y AS CHAR(26)) FROM 1 FOR 19) AS TIMESTAMP(0))
  |where a.X = b.X""".stripMargin
      val expected2 =
        """UPDATE
          |  db.table1
          |FROM
          |  (
          |    SELECT
          |      x,
          |      MAX(y) AS y
          |    FROM
          |      (
          |        SELECT
          |          CONCAT(CAST(CAST(t.x1 AS INTEGER) AS STRING), '_', UPPER(t.x2)) AS x,
          |          MAX(y) AS y
          |        FROM
          |          db.table2 AS t
          |        GROUP BY
          |          1
          |        UNION
          |        SELECT
          |          CONCAT(CAST(CAST(t.x1 AS INTEGER) AS STRING), '_', UPPER(t.x2)) AS x,
          |          MAX(y1) AS y
          |        FROM
          |          db.table3 AS t
          |        GROUP BY
          |          1
          |        UNION
          |        SELECT
          |          x1 AS x,
          |          MAX(y2) AS y
          |        FROM
          |          db.table4
          |        WHERE
          |          z IN (1, 2, 3)
          |        GROUP BY
          |          1
          |        UNION
          |        SELECT
          |          x1 AS x,
          |          MAX(y1) AS y
          |        FROM
          |          db.table4
          |        WHERE
          |          z IN (1, 2, 3)
          |        GROUP BY
          |          1
          |        UNION
          |        SELECT
          |          x1 AS x,
          |          MAX(y1) AS y
          |        FROM
          |          db.table5
          |        GROUP BY
          |          1
          |        UNION
          |        SELECT
          |          x1 AS x,
          |          MAX(y2) AS y
          |        FROM
          |          db.table6
          |        GROUP BY
          |          1
          |        UNION
          |        SELECT
          |          CONCAT(CAST(CAST(x1 AS INTEGER) AS STRING), '_', UPPER(x2)) AS x,
          |          MAX(CAST(SUBSTR(CAST(y1 AS STRING), 1, 19) AS TIMESTAMP())) AS y
          |        FROM
          |          db2.table7
          |        GROUP BY
          |          1
          |        UNION
          |        SELECT
          |          CONCAT(CAST(CAST(x1 AS INTEGER) AS STRING), '_', UPPER(x2)) AS x,
          |          MAX(CAST(SUBSTR(CAST(y1 AS STRING), 1, 19) AS TIMESTAMP())) AS y
          |        FROM
          |          db2.table8
          |        GROUP BY
          |          1
          |      ) AS interactions
          |    GROUP BY
          |      1
          |  ) AS b
          |SET
          |  y = CAST(SUBSTR(CAST(b.y AS STRING), 1, 19) AS TIMESTAMP())
          |WHERE
          |  a.x = b.x""".stripMargin
    }
    import f._

    compare(sql1, expected1)
    compare(sql2, expected2)
  }

  it should "parse not in" in {
    val tc = new {
      val sql =
"""INSERT INTO DB.A
|SELECT x, hash_sha256(lower(y))
|FROM DB.B
|WHERE z NOT IN (SELECT x FROM DB.A)""".stripMargin

      val expected =
"""INSERT INTO db.a
|SELECT
|  x,
|  SHA256(LOWER(y))
|FROM
|  db.b
|WHERE
|  z NOT IN (
|    SELECT
|      x
|    FROM
|      db.a
|  )""".stripMargin
    }
    import tc._
    compare(sql, expected)
  }

  it should "parse extract" in {
    val tc = new {
      val sql =
        """UPDATE CUSTOMER_SALES.CEP_GAME_PK_EXTERNAL_ID_MAP
          |SET CEP_REPORTING_FLAG = NULL
          |WHERE EXTRACT(YEAR FROM EVENT_DATE) = EXTRACT(YEAR FROM CURRENT_DATE)""".stripMargin

      val expected =
        """UPDATE
          |  customer_sales.cep_game_pk_external_id_map
          |SET
          |  cep_reporting_flag = NULL
          |WHERE
          |  EXTRACT(YEAR FROM event_date) = EXTRACT(YEAR FROM CURRENT_DATE())""".stripMargin

      val sql2 = """select * from ETL_CUSTOMER_SALES_INS.BASEBALL_TEAM_STANDINGS where TEAM_ID is not null and game_year = extract(year from (current_date))""".stripMargin
      val expected2 =
"""SELECT
|  *
|FROM
|  etl_customer_sales_ins.baseball_team_standings
|WHERE
|  team_id IS NOT NULL
|  AND game_year = EXTRACT(YEAR FROM (CURRENT_DATE()))""".stripMargin
      val sql3 =
"""-------
|
|CREATE MULTISET VOLATILE TABLE CEP_TICKET_SCAN_DATA_ALL_DIGITAL_SCANS_C5 AS (
|SELECT DISTINCT
|cep.attendingPatronAccountId AS account_id,
|cep.team_id,
|cep.ticketid,
|cep.ticketPrintScanId,
|cep.scannedDate_DT AS SCAN_DATE,
|rank() OVER(PARTITION BY account_id, EXTRACT(YEAR FROM SCAN_DATE) ORDER BY SCAN_DATE) AS RANK_NUMBER
|FROM CUSTOMER_SALES.CEP_TICKET_SCAN_DATA_ALL cep
|INNER JOIN CUSTOMER_SALES.TEAM_MASTER_MLB team ON (cep.TEAM_ID=team.TEAM_ID)
|INNER JOIN CUSTOMER_SALES.CEP_GAME_PK_EXTERNAL_ID_MAP mp ON (cep.scannedDate = mp.EVENT_DATE AND cep.team_id = mp.TEAM_ID_ORIGINAL AND cast(cep.eventId AS VARCHAR(250)) = mp.EXTERNAL_ID AND mp.CEP_REPORTING_FLAG = 'Y')
|WHERE account_id IS NOT NULL AND
|SCAN_DATE > '2017-07-13' AND
|cep.NTH_DAY_VALID_SCAN_FOR_TICKET IS NOT NULL AND
|cep.scanMediaTypeDesc = 'CUSTOM_TYPE_5' AND
|mp.MW_EVENT_TYPE = 'STANDARD'
|) WITH DATA PRIMARY INDEX (account_id, team_id, SCAN_DATE) ON COMMIT PRESERVE ROWS""".stripMargin
      val expected3 =
"""CREATE TABLE cep_ticket_scan_data_all_digital_scans_c5 AS (
|  SELECT DISTINCT
|    cep.attendingpatronaccountid AS account_id,
|    cep.team_id,
|    cep.ticketid,
|    cep.ticketprintscanid,
|    cep.scanneddate_dt AS scan_date,
|    RANK() OVER (PARTITION BY account_id, EXTRACT(YEAR FROM scan_date) ORDER BY scan_date) AS rank_number
|  FROM
|    customer_sales.cep_ticket_scan_data_all AS cep
|    JOIN customer_sales.team_master_mlb AS team
|      ON (cep.team_id = team.team_id)
|    JOIN customer_sales.cep_game_pk_external_id_map AS mp
|      ON (cep.scanneddate = mp.event_date
|      AND cep.team_id = mp.team_id_original
|      AND CAST(cep.eventid AS STRING) = mp.external_id
|      AND mp.cep_reporting_flag = 'Y')
|  WHERE
|    account_id IS NOT NULL
|    AND scan_date > '2017-07-13'
|    AND cep.nth_day_valid_scan_for_ticket IS NOT NULL
|    AND cep.scanmediatypedesc = 'CUSTOM_TYPE_5'
|    AND mp.mw_event_type = 'STANDARD'
|)""".stripMargin
    }
    import tc._
    compare(sql, expected)
    compare(sql2, expected2)
    compare(sql3, expected3)
  }

  it should "parse merge" in {
    val tc = new {
      val sql =
"""MERGE INTO
|DB.A A
|USING (
|SELECT
|X,
|Y,
|Z,
|CURRENT_TIMESTAMP(6) AS T
|
|FROM DB2.B ) b
|
|ON a.X = b.X
|
|WHEN MATCHED THEN UPDATE SET
|X = b.X,
|Y = b.Y,
|Z = b.Z,
|T = b.T
|
|WHEN NOT MATCHED THEN INSERT (
|X,
|Y,
|Z,
|T)
|
|VALUES (
|b.X,
|b.Y,
|b.Z,
|b.T)""".stripMargin

val expected =
"""MERGE INTO db.a a
|USING (
|  SELECT
|    x,
|    y,
|    z,
|    CURRENT_TIMESTAMP() AS t
|  FROM
|    db2.b
|) AS b
|  ON
|  a.x = b.x
|WHEN MATCHED THEN UPDATE SET
|  x = b.x
|  y = b.y
|  z = b.z
|  t = b.t
|WHEN NOT MATCHED BY TARGET THEN INSERT (
|  x,
|  y,
|  z,
|  t
|) VALUES (
|  b.x,
|  b.y,
|  b.z,
|  b.t
|)""".stripMargin
    }
    import tc._
    compare(parser.merge, sql, expected)
  }

  it should "ignore stats" in {
    val tc = new {
      val sql1 = "COLLECT STATISTICS USING SAMPLE DB.A COLUMN X"
      val sql2 = "COLLECT STATISTICS DB.A COLUMN (PARTITION)"
      val sql3 = "COLLECT STATISTICS COLUMN (EXTRACT(YEAR FROM(X))) AS B ON DB.A"
      val sql4 = "COLLECT STATISTICS COLUMN (PARTITION) ON DB.A"
      val sql5 = "COLLECT STATISTICS COLUMN (LOAD_INDICATOR) ON DB.A"
      val expected = ""
    }
    import tc._
    compare(sql1, expected)
    compare(sql2, expected)
    compare(sql3, expected)
    compare(sql4, expected)
    compare(sql5, expected)
  }

  it should "ignore lock table" in {
    val tc = new {
      val sql = """LOCK TABLE DB.$TABLE_NAME FOR EXCLUSIVE""".stripMargin
      val expected = """""".stripMargin
    }
    import tc._
    compare(parser.ignored, sql, expected)
  }

  it should "ignore drop table" in {
    val tc = new {
      val sql = """drop table db.a""".stripMargin
      val expected = """""".stripMargin
    }
    import tc._
    compare(sql, expected)
  }

  it should "ignore diagnostic" in {
    val tc = new {
      val sql = """DIAGNOSTIC "COLLECTSTATS, SAMPLESIZE=5" ON FOR SESSION""".stripMargin
      val expected = """""".stripMargin
    }
    import tc._
    compare(sql, expected)
  }

  it should "parse like all" in {
    val tc = new {
      val sql =
"""UPDATE
|  db.a
|SET
|  n = 1
|WHERE
|  x = {{ x }}
|  AND y IS NULL
|  AND z = 11
|  AND c LIKE ALL ('ABC%123', 'XYZ%123')""".stripMargin
      val expected =
"""UPDATE
  |  db.a
  |SET
  |  n = 1
  |WHERE
  |  x = {{ x }}
  |  AND y IS NULL
  |  AND z = 11
  |  AND (c LIKE 'ABC%123'
  |  AND c LIKE 'XYZ%123')""".stripMargin
    }
    compare(tc.sql, tc.expected)
  }

  it should "parse aggregate expression" in {
    val tc = new {
      val sql =
      """SELECT A.*, ROW_NUMBER() OVER(PARTITION BY x,y,z ORDER BY t ASC) AS Q
        |FROM A""".stripMargin
      val expected =
"""SELECT
|  a.*,
|  ROW_NUMBER() OVER (PARTITION BY x, y, z ORDER BY t ASC) AS q
|FROM
|  a""".stripMargin
    }
    compare(tc.sql, tc.expected)
  }

  it should "parse bash variable" in {
    val tc = new {
      val sql =
"""UPDATE a
|FROM (
|  SELECT X, Y, SUM(Z) AS Z
|  FROM DB.$TABLE1
|  GROUP BY X, Y
|) q,
|DB.TABLE1 a
|SET
|  ${COLUMN} = q.Y,
|  T = CURRENT_TIMESTAMP(0)
|WHERE
|  q.X = a.X
|  AND q.Y = a.Y
|  --AND q.Z <> a.$COLUMN
|  --AND a.$COLUMN IS NOT NULL""".stripMargin
      val expected =
"""UPDATE
|  db.table1
|FROM
|  (
|    SELECT
|      x,
|      y,
|      SUM(z) AS z
|    FROM
|      db.{{ table1 }}
|    GROUP BY
|      x,
|      y
|  ) AS q
|SET
|  {{ column }} = q.y,
|  t = CURRENT_TIMESTAMP()
|WHERE
|  q.x = a.x
|  AND q.y = a.y""".stripMargin
    }
    compare(tc.sql, tc.expected)
  }

  it should "rewrite create table" in {
    val tc = new {
      val sql =
"""CREATE MULTISET VOLATILE TABLE A (X BIGINT, Y VARCHAR(3000)) PRIMARY INDEX (X) ON COMMIT preserve rows""".stripMargin
      val expected =
"""CREATE TABLE a(
|  x INTEGER,
|  y STRING
|)
|CLUSTER BY x""".stripMargin
    }
    compare(parser.createTable, tc.sql, tc.expected)
  }

  it should "rewrite add months" in {
    val tc = new {
      val sql =
        """UPDATE A
          |SET
          |X = add_months(Z, 2),
          |Y = (CASE WHEN Y IS NULL THEN add_months(Z, 2) ELSE Y END)
          |WHERE
          |W LIKE '%_W_%' AND
          |Z IS NOT NULL""".stripMargin
      val expected =
        """UPDATE
          |  a
          |SET
          |  x = DATE_ADD(z, INTERVAL 2 MONTH),
          |  y = (CASE
          |    WHEN y IS NULL THEN DATE_ADD(z, INTERVAL 2 MONTH)
          |    ELSE y
          |  END)
          |WHERE
          |  w LIKE '%_W_%'
          |  AND z IS NOT NULL""".stripMargin
    }
    compare(tc.sql, tc.expected)
  }

  it should "rewrite date arithmetic" in {
    val tc = new {
      val sql0 = "DATE-365"
      val expected0 = "DATE_ADD(date, INTERVAL - 365 DAY)"
      val sql1 = "DATE+365"
      val expected1 = "DATE_ADD(date, INTERVAL 365 DAY)"
      val sql =
"""CREATE VOLATILE TABLE DB.A AS
|(
|SELECT CAST(X AS INT) AS X, Y, Z
|from DB1.B
|where W = 6
|AND Z >= DATE-365
|)
|WITH DATA PRIMARY INDEX (V)
|ON COMMIT PRESERVE ROWS""".stripMargin
      val expected =
"""CREATE TABLE db.a AS (
|  SELECT
|    CAST(x AS INTEGER) AS x,
|    y,
|    z
|  FROM
|    db1.b
|  WHERE
|    w = 6
|    AND z >= DATE_ADD(date, INTERVAL - 365 DAY)
|)""".stripMargin
    }
    compare(parser.dateArithmetic, tc.sql0, tc.expected0)
    compare(parser.dateArithmetic, tc.sql1, tc.expected1)
    compare(tc.sql, tc.expected)
  }

  it should "rewrite timestamp arithmetic" in {
    val tc = new {
      val sql0 = "current_timestamp(0) - INTERVAL '2' DAY"
      val expected0 = "DATE_ADD(CURRENT_TIMESTAMP(), INTERVAL - '2' DAY)"
      val sql =
"""UPDATE DB.A A SET X =
|CASE WHEN
|A.y IN (1,2,3) AND
|(SELECT MAX(1) FROM DB.B B WHERE A.W = B.W AND A.z = b.z AND B.y = 1)
|= 1
|AND (SELECT MAX(1) FROM DB.B B WHERE A.W = B.W AND A.z = b.z AND (B.V > 0 OR B.U > 0) )
|IS NULL
|THEN 1 ELSE 0 END
|WHERE S NOT IN (43, 56, 60)
|AND W IN (SELECT W FROM DB.B WHERE T > current_timestamp(0) - INTERVAL '2' DAY)""".stripMargin
      val expected =
"""UPDATE
|  db.a a
|SET
|  x = CASE
|    WHEN a.y IN (1, 2, 3)
|    AND (
|      SELECT
|        MAX(1)
|      FROM
|        db.b AS b
|      WHERE
|        a.w = b.w
|        AND a.z = b.z
|        AND b.y = 1
|    ) = 1
|    AND (
|      SELECT
|        MAX(1)
|      FROM
|        db.b AS b
|      WHERE
|        a.w = b.w
|        AND a.z = b.z
|        AND (b.v > 0
|        OR b.u > 0)
|    ) IS NULL THEN 1
|    ELSE 0
|  END
|WHERE
|  s NOT IN (43, 56, 60)
|  AND w IN (
|    SELECT
|      w
|    FROM
|      db.b
|    WHERE
|      t > DATE_ADD(CURRENT_TIMESTAMP(), INTERVAL - '2' DAY)
|  )""".stripMargin
    }
    compare(parser.timestampArithmetic, tc.sql0, tc.expected0)
    compare(tc.sql, tc.expected)
  }

  it should "rewrite in multi" in {
    val tc = new {
      val sql =
"""UPDATE DB.A
|SET X = 'Y'
|WHERE X IS NULL AND (Y, Z, T) IN (
|SELECT Y, Z, T FROM DB.A WHERE X IS NULL GROUP BY 1, 2, 3 HAVING COUNT(*)=1)""".stripMargin
      val expected =
"""UPDATE
|  db.a
|SET
|  x = 'Y'
|WHERE
|  x IS NULL
|  AND (
|    y IN (
|      SELECT
|        y,
|        z,
|        t
|      FROM
|        db.a
|      WHERE
|        x IS NULL
|      GROUP BY
|        1,
|        2,
|        3
|      HAVING
|        COUNT(*) = 1
|    )
|    AND z IN (
|      SELECT
|        y,
|        z,
|        t
|      FROM
|        db.a
|      WHERE
|        x IS NULL
|      GROUP BY
|        1,
|        2,
|        3
|      HAVING
|        COUNT(*) = 1
|    )
|    AND t IN (
|      SELECT
|        y,
|        z,
|        t
|      FROM
|        db.a
|      WHERE
|        x IS NULL
|      GROUP BY
|        1,
|        2,
|        3
|      HAVING
|        COUNT(*) = 1
|    )
|  )""".stripMargin
    }
    compare(tc.sql, tc.expected)
  }

  it should "rewrite not in multi" in {
    val tc = new {
      val sql =
        """INSERT INTO DB.A
          |SELECT * FROM $TABLE_NAME WHERE (X, Y, Z) NOT IN
          |(SELECT X, Y, Z FROM DB.A)""".stripMargin
      val expected =
        """INSERT INTO db.a
          |SELECT
          |  *
          |FROM
          |  {{ table_name }}
          |WHERE
          |  (
          |    x NOT IN (
          |      SELECT
          |        x,
          |        y,
          |        z
          |      FROM
          |        db.a
          |    )
          |    AND y NOT IN (
          |      SELECT
          |        x,
          |        y,
          |        z
          |      FROM
          |        db.a
          |    )
          |    AND z NOT IN (
          |      SELECT
          |        x,
          |        y,
          |        z
          |      FROM
          |        db.a
          |    )
          |  )""".stripMargin
    }
    compare(tc.sql, tc.expected)
  }

  it should "rewrite concat" in {
    val tc = new {
      val sql0 = "'it-'||trim(A.X)||'-'||trim(A.Y)||'-'||trim(A.Z)"
      val expected0 = "CONCAT('it-', TRIM(a.x), '-', TRIM(a.y), '-', TRIM(a.z))"
      val sql1 = "'it-'||trim(A.X)||'-'||trim(A.Y)||'-'||trim(A.Z) as s"
      val expected1 = "CONCAT('it-', TRIM(a.x), '-', TRIM(a.y), '-', TRIM(a.z)) AS s"
      val sql =
"""CREATE MULTISET VOLATILE TABLE a as
  |(
  |select B.W
  |, B.X
  |, B.Y
  |, B.Z
  |, 's'||trim(B.Y)||'-'||trim(A.Z)||'-'||trim(B.X) as s
  |from	b B, db.A A
  |where A.X = B.X
  |)WITH DATA ON COMMIT PRESERVE ROWS""".stripMargin
      val expected =
"""CREATE TABLE a AS (
|  SELECT
|    b.w,
|    b.x,
|    b.y,
|    b.z,
|    CONCAT('s', TRIM(b.y), '-', TRIM(a.z), '-', TRIM(b.x)) AS s
|  FROM
|    b AS b,
|    db.a AS a
|  WHERE
|    a.x = b.x
|)""".stripMargin
    }
    compare(parser.expr, tc.sql0, tc.expected0)
    compare(parser.exprProjection, tc.sql1, tc.expected1)
    compare(tc.sql, tc.expected)
  }

  it should "parse coalesce" in {
    val tc = new {
      val sql0 = "COALESCE(aBcD, 'N/A')"
      val expected0 = "COALESCE(abcd, 'N/A')"
      val sql1 =
        """SELECT
          |x,
          |y,
          |COALESCE(z, 'N/A')
          |FROM DB.A
          |WHERE X IS NOT NULL
          |GROUP BY 1, 2, 3
          |HAVING COUNT(*)>1""".stripMargin
      val expected1 =
        """SELECT
          |  x,
          |  y,
          |  COALESCE(z, 'N/A')
          |FROM
          |  db.a
          |WHERE
          |  x IS NOT NULL
          |GROUP BY
          |  1,
          |  2,
          |  3
          |HAVING
          |  COUNT(*) > 1""".stripMargin
    }
    compare(parser.function, tc.sql0, tc.expected0)
    compare(tc.sql1, tc.expected1)
  }

  it should "rewrite oCollect fn" in {
    val sql =
"""UPDATE a
|FROM
|DB.A a,
|(
|SELECT
|X,
|Y,
|REGEXP_REPLACE(UDF.OCOLLECT(
|CASE
|WHEN I = 1 THEN 'abc' || CAST(J AS VARCHAR(10))
|ELSE 'xyz' || CAST(J AS VARCHAR(10))
|END
|), ',', '; ', 1, 0, 'i') AS Z
|FROM DB1.B
|GROUP BY 1,2
|) Q
|SET
|W = W || Z,
|T = current_timestamp(0)
|WHERE
|a.Y = Q.Y AND
|a.X = Q.X""".stripMargin
    val expected = """""".stripMargin
  }

  it should "rewrite substring fn" in {
    val tc = new {
      val sql = """SUBSTRING(CAST(y1 AS CHAR(26)) FROM 1 FOR 19)""".stripMargin
      val expected = """SUBSTR(CAST(y1 AS STRING), 1, 19)""".stripMargin
    }
    compare(parser.teradataFns, tc.sql, tc.expected)
  }

  it should "rewrite oreplace fn" in {
    val tc = new {
      val sql =
        "SELECT X, OREPLACE(Y, 'Lorem Ipsum Dolor', 'Lorem Ipsum') AS Y FROM DB.A"
      val expected =
"""SELECT
  |  x,
  |  REPLACE(y, 'Lorem Ipsum Dolor', 'Lorem Ipsum') AS y
  |FROM
  |  db.a""".stripMargin
    }
    compare(tc.sql, tc.expected)
  }

  it should "rewrite cast as number" in {
    val tc = new {
      val sql =
        """CAST(A AS NUMBER)""".stripMargin
      val expected =
        """CAST(a AS NUMERIC)""".stripMargin
    }
    compare(parser.expr, tc.sql, tc.expected)
  }

  it should "rewrite hash_sha256 fn" in {
    val sql =
"""hash_sha256(lower(i.email_addr))""".stripMargin
    val expected = """SHA256(LOWER(i.email_addr))"""
    compare(parser.teradataFns, sql, expected)
  }

  it should "rewrite not like all" in {
    val tc = new {
      val sql =
        """|UPDATE DB.X
           |SET Y = 'Y', Z = '${Z}'
           |WHERE W = ${W} AND Y IS NULL AND V = 66 AND
           |U IS NULL AND T LIKE 'G%' AND S NOT LIKE ALL ('%_1_%', '%_2_%', '%_3_%')""".stripMargin
      val expected =
        """UPDATE
          |  db.x
          |SET
          |  y = 'Y',
          |  z = '${Z}'
          |WHERE
          |  w = {{ w }}
          |  AND y IS NULL
          |  AND v = 66
          |  AND u IS NULL
          |  AND t LIKE 'G%'
          |  AND (s NOT LIKE '%_1_%'
          |  AND s NOT LIKE '%_2_%'
          |  AND s NOT LIKE '%_3_%')""".stripMargin
    }
    compare(tc.sql, tc.expected)
  }

  it should "rewrite like all" in {
    val tc = new {
      val sql =
        """UPDATE DB.A
          |SET X = 1, Y = '${Y}'
          |WHERE Z = ${Z} AND X IS NULL AND W = 2 AND
          |V LIKE ALL ('ABC%123', 'XYZ%123')""".stripMargin
      val expected =
        """UPDATE
          |  db.a
          |SET
          |  x = 1,
          |  y = '${Y}'
          |WHERE
          |  z = {{ z }}
          |  AND x IS NULL
          |  AND w = 2
          |  AND (v LIKE 'ABC%123'
          |  AND v LIKE 'XYZ%123')""".stripMargin
    }
    compare(tc.sql, tc.expected)
  }

  it should "rewrite like any" in {
    val tc = new {
      val sql =
        """UPDATE DB.A
          |SET X = 1, Y = '${Y}'
          |WHERE Z = ${Z} AND X IS NULL AND W = 2 AND
          |U LIKE ANY ('ABC%123', 'XYZ%123')""".stripMargin
      val expected =
        """UPDATE
          |  db.a
          |SET
          |  x = 1,
          |  y = '${Y}'
          |WHERE
          |  z = {{ z }}
          |  AND x IS NULL
          |  AND w = 2
          |  AND (u LIKE 'ABC%123'
          |  OR u LIKE 'XYZ%123')""".stripMargin
    }
    compare(tc.sql, tc.expected)
  }

  it should "rewrite position fn" in {
    val tc = new {
      val sql = "POSITION('(' IN Z)"
      val expected = "STRPOS(z, '(')"
    }
    compare(parser.teradataFns, tc.sql, tc.expected)
  }

  it should "rewrite index fn" in {
    val tc = new {
      val sql = "INDEX (x, 'abc' )"
      val expected = "STRPOS(x, 'abc')"
    }
    compare(parser.teradataFns, tc.sql, tc.expected)
  }

  it should "rewrite regexp_substr fn" in {
    val tc = new {
      val sql = "regexp_substr(A.X, '[^:]+', 1, 1)"
      val expected = "REGEXP_EXTRACT(a.x, '[^:]+')"
    }
    compare(parser.teradataFns, tc.sql, tc.expected)
  }

  it should "rewrite to_char fn" in {
    val tc = new {
      val sql = "TO_CHAR(t, 'YYYY-MM-DD HH24:MI:SS')"
      val expected = "FORMAT_DATETIME('%Y-%m-%d %H:%M:%S', t)"
    }
    compare(parser.teradataFns, tc.sql, tc.expected)
  }

  it should "rewrite instr fn" in {}

  it should "rewrite udf.first_day_of_month" in {}

  it should "rewrite strtok fn" in {}

  it should "rewrite zeroifnull fn" in {}


  def compare(sql: String, expected: String): Unit = {
    compare(parser.statement, sql, expected)
  }

  def compare[T<:SQL](p: parser.Parser[T], sql: String, expected: String): Unit = {
    val result: Either[Err,T] = parser.parse(p, sql)
    assert(result.isRight, result.left.toOption.map(_.msg).getOrElse(""))
    result match {
      case Left(err) =>
        System.err.println(err.msg)
      case Right(stmt) =>
        assert(stmt.fmt.print() == expected)
    }
  }

}
