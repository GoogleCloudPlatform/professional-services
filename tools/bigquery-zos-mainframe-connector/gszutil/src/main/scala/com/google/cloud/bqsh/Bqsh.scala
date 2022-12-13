/*
 * Copyright 2022 Google LLC All Rights Reserved
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

package com.google.cloud.bqsh

import com.google.cloud.bqsh.cmd._
import com.google.cloud.imf.gzos.{MVS, Util}
import com.google.cloud.imf.util.{Logging, Services}

import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import scala.collection.mutable
import scala.collection.mutable.ListBuffer

object Bqsh extends Logging {
  val UserAgent: String = Services.UserAgent

  def main(args: Array[String]): Unit = {
    val zos = Util.zProvider
    zos.init()
    val script = zos.readStdin()

    logger.info(s"Passed args: ${args.length}")
    logger.info("-------------------------------------------------")

    val jobInfoMap = Util.toMap(zos.getInfo)
    jobInfoMap.put("script", script)
    logger.info("Started BQSH")
    logger.info(jobInfoMap)

    // TODO collect job-specific environment variables from parm file
    val interpreter = new Interpreter(zos, getEnv(sys.env), true, true)
    val result = interpreter.runScript(script)
    if (result.exitCode == 0) Util.exit
    else System.exit(result.exitCode)
  }

  /** adds date and time environment variables
    * useful for naming
    * @return
    */
  def getEnv(env0: Map[String, String]): Map[String, String] = {
    val env = mutable.Map.from(env0)
    val t = LocalDateTime.now()

    def format(t: LocalDateTime, pattern: String): String =
      t.format(DateTimeFormatter.ofPattern(pattern))

    // date '+%Y%m%d' YYYYMMDD
    env.put("DATE", format(t,"uuuuMMdd"))

    // date '+%Y%m%d%H%M%S' YYYYMMDDHHMMSS
    // timestamp at second resolution
    env.put("DATE14", format(t,"uuuuMMddHHmmss"))
    env.put("DATE15", format(t,"uuuuMMdd_HHmmss"))

    // date '+%H%M' HHMM
    env.put("TIME", format(t,"HHmm"))
    // date '+%H%M%S' HHMMSS
    env.put("TIME6", format(t,"HHmmss"))

    // timestamp at minute resolution
    // date '+%Y%m%d%H%M' YYYYMMDDHHMM
    env.put("DATE12", format(t,"uuuuMMddHHmm"))
    env.put("UNIXTIME", (System.currentTimeMillis() / 1000L).toString)

    env.toMap
  }

  class Interpreter(zos: MVS, sysEnv: Map[String, String], var exitOnError: Boolean = true, var printCommands: Boolean = true) {

    val env: mutable.Map[String, String] = mutable.Map.from(sysEnv)

    def runWithArgs(args: Seq[String]): Result = {
      val result = exec(args, zos, env.toMap)
      if (result.exitCode != 0) {
        val sb = new mutable.StringBuilder()
        sb.append(s"${args.mkString(" ")} returned exit code ${result.exitCode}")
        if (result.message.nonEmpty) {
          sb.append("\n")
          sb.append(result.message)
        }
        logger.error(sb.result)
        if (exitOnError)
          System.exit(result.exitCode)
      }
      env ++= result.env
      result.copy(env = env.toMap)
    }

    def runScript(script: String): Result = {
      for (s <- splitSH(script)) {
        val result = runWithArgs(readArgs(s))
        if (result.exitCode != 0 && exitOnError) {
          return result
        }
      }
      Result(env.toMap)
    }
  }

  def runCommand[T](cmd: Command[T],
                    args: Seq[String],
                    zos: MVS,
                    env: Map[String, String]): Result = {
    cmd.parser.parse(args, env) match {
      case Some(c) =>
        logger.info(s"Command '${cmd.name}' started")
        val result = cmd.run(c, zos, env)
        logger.info(s"Command '${cmd.name}' finished: exit ${result.exitCode}")
        result
      case _ =>
        Result.Failure(s"Unable to parse args for ${cmd.name}:\n\t${args.mkString(" ")}")
    }
  }

  def exec(args: Seq[String], zos: MVS, env: Map[String, String]): Result = {
    BqshParser.parse(args, env) match {
      case Some(cmd) =>
        logger.info(s"+ ${cmd.name} ${cmd.args.mkString(" ")}")
        val sub = cmd.args.headOption.getOrElse("")
        val subArgs = cmd.args.drop(1)
        if (cmd.name == "bq") {
          sub match {
            case "mk" =>
              runCommand(Mk, subArgs, zos, cmd.env)
            case "query" =>
              runCommand(Query, subArgs, zos, cmd.env)
            case "export" =>
              runCommand(Export, subArgs, zos, cmd.env)
            case "extract" =>
              runCommand(Extract, subArgs, zos, cmd.env)
            case "load" =>
              runCommand(Load, subArgs, zos, cmd.env)
            case "rm" =>
              runCommand(Rm, subArgs, zos, cmd.env)
            case _ =>
              Result.Failure(s"invalid command '${args.mkString(" ")}'")
          }
        } else if (cmd.name == "gsutil") {
          sub match {
            case "cp" =>
              runCommand(Cp, cmd.args, zos, cmd.env)
            case "rm" =>
              runCommand(GsUtilRm, cmd.args, zos, cmd.env)
            case _ =>
              Result.Failure(s"invalid command '${args.mkString(" ")}'")
          }
        } else if (cmd.name == "gszutil") {
          runCommand(GsZUtil, cmd.args, zos, cmd.env)
        } else if (cmd.name == "gcloud") {
          sub match {
            case "dataflow" =>
              subArgs.toList match {
                case "flex-template" :: "run" :: runArgs =>
                  runCommand(DataflowFlexTemplateRun, runArgs, zos, cmd.env)
                case _ =>
                  Result.Failure(s"invalid command '${args.mkString(" ")}'")
              }
            case "pubsub" =>
              subArgs.toList match {
                case "topics" :: "publish" :: runArgs =>
                  runCommand(Publish, runArgs, zos, cmd.env)
                case _ =>
                  Result.Failure(s"invalid command '${args.mkString(" ")}'")
              }
            case _ =>
              Result.Failure(s"invalid command '${args.mkString(" ")}'")
          }
        } else if (cmd.name == "scp") {
          runCommand(Scp, cmd.args, zos, cmd.env)
        } else if (cmd.name == "curl") {
          runCommand(Curl, cmd.args, zos, cmd.env)
        } else if (cmd.name == "jclutil") {
          runCommand(JCLUtil, cmd.args, zos, cmd.env)
        } else if (cmd.name == "sdsfutil") {
          runCommand(SdsfUtil, cmd.args, zos, cmd.env)
        } else {
          Bqsh.eval(cmd)
        }
      case _ =>
        Result.Failure(s"-bqsh: ${args.head}: command not found")
    }
  }

  def replaceEnvVars(s: String, env: Map[String, String]): String = {
    var variable = false
    var bracket = false
    var singleQuoted = false
    var doubleQuoted = false
    val chars = s.toCharArray.toSeq
    var i = 0
    val varName = new StringBuilder(64)
    val sb = new StringBuilder(s.length)
    var c: Char = 0
    var next = c
    while (i < chars.length) {
      c = chars(i)
      if (i + 1 < chars.length) {
        next = chars(i + 1)
      } else {
        next = ' '
      }

      if (variable || bracket) {
        if (bracket && next == '}') {
          variable = false
          bracket = false
          varName.append(c)
          if (!(c.isLetterOrDigit || c == '_')) {
            throw new IllegalArgumentException(s"invalid variable ${varName.result}")
          }
          sb.append(env.getOrElse(varName.result(), ""))
          varName.clear()
        } else if (!(next.isLetterOrDigit || next == '_')) {
          variable = false
          varName.append(c)
          if (!(c.isLetterOrDigit || c == '_')) {
            throw new IllegalArgumentException(s"invalid variable ${varName.result}")
          }
          sb.append(env.getOrElse(varName.result(), ""))
          varName.clear()
        } else {
          varName.append(c)
        }
      } else {
        if (!(singleQuoted || doubleQuoted)) {
          if (c == '\'') {
            singleQuoted = true
            sb.append(c)
          } else if (c == '"') {
            doubleQuoted = true
            sb.append(c)
          } else if (c == '\\' && next == '$') {
            i += 1
            sb.append(next)
          } else if (c == '$' && next == '{') {
            variable = true
            bracket = true
            i += 1
          } else if (c == '$') {
            variable = true
          } else {
            sb.append(c)
          }
        } else {
          if (singleQuoted && c == '\'') {
            singleQuoted = false
            sb.append(c)
          } else if (doubleQuoted && c == '"') {
            doubleQuoted = false
            sb.append(c)
          } else if (c == '\\' && next == '$') {
            i += 1
            sb.append(next)
          } else if (!singleQuoted && c == '$' && next == '{') {
            variable = true
            bracket = true
            i += 1
          } else if (!singleQuoted && c == '$') {
            variable = true
          } else {
            sb.append(c)
          }
        }
      }
      i += 1
    }
    if (singleQuoted)
      throw new IllegalArgumentException("unmatched single quote")
    if (doubleQuoted)
      throw new IllegalArgumentException("unmatched double quote")
    if (bracket)
      throw new IllegalArgumentException("unmatched bracket")
    sb.result()
  }

  def readArgs(s: String): Seq[String] = {
    var singleQuoted = false
    var doubleQuoted = false
    val chars = s.toCharArray.toSeq
    var i = 0
    val l = new ListBuffer[String]()
    val sb = new StringBuilder(1024)
    var c: Char = 0
    var next: Char = 0
    while (i < chars.length) {
      c = chars(i)
      next = chars.lift(i + 1).getOrElse('\n')
      if (doubleQuoted || singleQuoted) {
        if (c == '"' && doubleQuoted) {
          doubleQuoted = false
        } else if (c == '\'' && singleQuoted) {
          singleQuoted = false
        } else if (c != '\n') {
          sb.append(c)
        }
      } else {
        if (c == '"') {
          doubleQuoted = true
        } else if (c == '\'') {
          singleQuoted = true
        } else if (c == ' ' || c == '\t') {
          if (sb.nonEmpty) {
            l += sb.result()
            sb.clear()
          }
        } else if (c == '\\' && next == '\n') {
          i += 1
        } else {
          sb.append(c)
        }
      }

      i += 1
    }
    if (sb.nonEmpty) {
      l += sb.result()
      sb.clear()
    }
    l.result()
  }

  def splitSH(s: String): Seq[String] = {
    var commentLine = false
    var singleQuoted = false
    var doubleQuoted = false
    val chars = s.toCharArray.toSeq
    var i = 0
    val l = new ListBuffer[String]()
    val sb = new StringBuilder(1024)
    var c: Char = 0
    var next = c
    while (i < chars.length) {
      c = chars(i)
      if (i + 1 < chars.length) {
        next = chars(i + 1)
      } else {
        next = ';'
      }
      if (!commentLine) {
        if ((c == ';' || c == '\n' || c == '#') && !(singleQuoted || doubleQuoted)) {
          val result = sb.result().trim
          if (result.nonEmpty)
            l += result
          sb.clear()
        }

        if (!(singleQuoted || doubleQuoted)) {
          if (c == '#') {
            commentLine = true
          } else if (c == '\'') {
            singleQuoted = true
          } else if (c == '"') {
            doubleQuoted = true
          } else if (c == '\\' && next == '\n') {
            i += 1
          }
        } else {
          if (singleQuoted && c == '\'') {
            singleQuoted = false
          } else if (doubleQuoted && c == '"') {
            doubleQuoted = false
          }
        }
        if (!commentLine && c != '\\')
          sb.append(c)
      } else {
        if (commentLine && c == '\n') {
          commentLine = false
        }
      }
      i += 1
    }
    if (sb.nonEmpty) {
      val result = sb.result().trim
      sb.clear()
      if (result.nonEmpty)
        l += result
    }
    if (singleQuoted)
      throw new IllegalArgumentException("unmatched single quote")
    if (doubleQuoted)
      throw new IllegalArgumentException("unmatched double quote")
    l.result()
  }

  def splitSQL(s: String): Seq[String] = {
    var commentLine = false
    var commentBlock = false
    var singleQuoted = false
    var doubleQuoted = false
    val normalizedStr = s.trim.concat(if (s.trim.lastOption.contains(';')) "" else ";")
    val chars = normalizedStr.toCharArray.toSeq
    var i = 0
    val l = new ListBuffer[String]()
    val sb = new StringBuilder(1024)
    var c = 0.toChar
    var next = c
    while (i < chars.length) {
      c = chars(i)
      if (i + 1 < chars.length) {
        next = chars(i + 1)
      } else {
        next = ';'
      }
      if (!commentLine && !commentBlock) {
        if (c == ';' && !singleQuoted && !doubleQuoted) {
          val result = sb.result().trim
          if (result.nonEmpty)
            l += result
          sb.clear()
        } else {
          sb.append(c)
        }

        if (!singleQuoted && !doubleQuoted) {
          if (c == '-' && next == '-') {
            commentLine = true
            i += 1
            sb.append(next)
          } else if (c == '/' && next == '*') {
            commentBlock = true
            i += 1
            sb.append(next)
          } else if (c == '\'') {
            singleQuoted = true
          } else if (c == '"') {
            doubleQuoted = true
          }
        } else {
          if (singleQuoted && c == '\'') {
            singleQuoted = false
          } else if (doubleQuoted && c == '"') {
            doubleQuoted = false
          }
        }
      } else {
        sb.append(c)
        if (commentLine && c == '\n') {
          commentLine = false
        } else if (commentBlock && c == '*' && next == '/') {
          commentBlock = false
          i += 1
          sb.append(next)
        }
      }

      i += 1
    }
    l.result()
  }

  def eval(cmd: ShCmd): Result = {
    if (cmd.name == "echo") {
      logger.info(cmd.args.mkString(" "))
      Result.Success
    } else {
      val i = cmd.name.indexOf('=')
      if (i > 0) {
        val varName = cmd.name.substring(0, i)
        val value = cmd.name.substring(i + 1)
        Result.withExport(varName, value)
      } else {
        val msg = s"${cmd.name}: command not found"
        logger.error(msg)
        Result.Failure(msg)
      }
    }
  }
}
