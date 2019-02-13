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

import java.nio.charset.StandardCharsets
import java.nio.file.{Files, Path, Paths}
import java.util.function.Consumer

import com.google.cloud.pso.sql.ast.Statement
import com.google.cloud.pso.sql.ast.Statements.IgnoredStatement

object RewriteDir {

  case class Result(stmt: Option[Statement] = None, err: Option[Err] = None)

  case class FileParser(parser: SQLParser) extends Consumer[Path] {
    private var success = 0
    private var failure = 0
    private var skipped = 0
    private var ignored = 0
    private var start = 0L
    private var end = 0L

    def err(x: Err, f: Path): Result = {
      System.err.println(s"Parsing failed for $f: ${x.msg}")
      Result(err = Option(x))
    }

    def stmt(x: Statement, f: Path): Result = {
      x match {
        case IgnoredStatement(_) =>
          ignored += 1
        case _ =>
          Files.write(f, x.fmt.print().getBytes(StandardCharsets.UTF_8))
      }
      Result(stmt = Option(x))
    }

    def processFile(f: Path, parser: SQLParser): Option[Result] = {
      if (f.toString.endsWith(".sql")) {
        val sql = new String(Files.readAllBytes(f), StandardCharsets.UTF_8)
        Option(parser.parseStatement(sql).fold(err(_, f), stmt(_, f)))
      } else {
        None
      }
    }

    def print: String = {
      if (end == 0) end = System.currentTimeMillis()
      val timeElapsed = (end - start)/1000L
      Seq(
        s"Success:\t$success",
        s"Failure:\t$failure",
        s"Ignored:\t$ignored",
        s"Non-SQL:\t$skipped",
        s"Time Elapsed:\t${timeElapsed}s"
      ).mkString("\n")
    }

    override def accept(f: Path): Unit = {
      if (start == 0) start = System.currentTimeMillis()
      try {
        processFile(f, parser) match {
          case Some(result) =>
            result match {
              case Result(Some(_), _) =>
                success += 1
              case _ =>
                failure += 1
            }
          case _ =>
            skipped += 1
        }
      } catch {
        case e: Exception =>
          System.err.println(s"exception parsing $f: ${e.getMessage}")
      }
    }
  }

  def main(args: Array[String]): Unit = {
    val parse = FileParser(new StandardSQLParser)
    val dir = Paths.get(args.head)
    Files.walk(dir).forEach(parse)
    System.out.println(parse.print)
  }
}
