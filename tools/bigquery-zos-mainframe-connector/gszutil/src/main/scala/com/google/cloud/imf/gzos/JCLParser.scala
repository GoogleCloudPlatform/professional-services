/*
 * Copyright 2022 Google LLC All Rights Reserved.
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

package com.google.cloud.imf.gzos

import scala.collection.mutable
import scala.collection.mutable.{ArrayBuffer, ListBuffer}

object JCLParser {
  // https://www.ibm.com/support/knowledgecenter/SSLTBW_2.4.0/com.ibm.zos.v2r4.ieab600/iea3b6_JCL_statement_fields.htm

  private def isUpperChar(c: Char): Boolean =
    c >= 'A' && c <= 'Z'

  private def isNameChar(c: Char): Boolean =
    isUpperChar(c) || c == '$' || c == '#' || c == '@'

  class DDStatementBuilder {
    private var name: String = ""
    private var lrecl: Int = -1
    private val dsnBuf = ListBuffer.empty[String]
    private val paramStr = new StringBuilder()
    private val params = ListBuffer.empty[(String,String)]
    private var continue = false

    def getName: String = name

    def isContinued: Boolean = continue

    def setContinue(b: Boolean): DDStatementBuilder = {
      continue = b
      this
    }

    def setName(s: String): DDStatementBuilder = {
      name = s
      this
    }

    def setLrecl(x: Int): DDStatementBuilder = {
      lrecl = x
      this
    }

    def addDsn(s: String): DDStatementBuilder = {
      dsnBuf.append(s)
      this
    }

    def addParams(s: String): DDStatementBuilder = {
      paramStr.append(s)
      this
    }

    def addParam(k: String, v: String): DDStatementBuilder = {
      val v1 =
        if (v.startsWith("'") && v.endsWith("'")) v.substring(1,v.length-1)
        else v
      params.append((k,v1))
      if (k == "LRECL" && lrecl == -1) lrecl = v.toInt
      else if (k == "DSN") addDsn(v1)
      this
    }

    def accept(param: String): DDStatementBuilder = {
      filterParameters(param).split(",").foreach{t =>
        val sep = t.indexOf('=') + 1
        if (sep > -1 && t.length - sep > 0) {
          addParam(t.substring(0,sep-1), t.substring(sep))
        }
      }
      this
    }

    def build(): DDStatement = {
      if (paramStr.nonEmpty) {
        // TODO handle quoted strings
        accept(paramStr.result())
        paramStr.clear()
      }

      DDStatement(name, lrecl, dsnBuf.toList)
    }

    def clear(): DDStatementBuilder = {
      name = ""
      lrecl = -1
      dsnBuf.clear()
      params.clear()
      this
    }
  }

  case class DDStatement(name: String,
                         lrecl: Int,
                         dsn: Seq[String])

  case class JclStep(stepName: String, ddStatements: Seq[DDStatement])

  case class Statement(record: String) {
    require(record.length == 80, "JCL statement is 80 columns")
    val isStatement: Boolean = record.startsWith("//")
    val isComment: Boolean = isStatement && record.charAt(2) == '*'
    val isContinued: Boolean = isStatement && record.charAt(71) != ' '
    val isContinuation: Boolean = isStatement && record.charAt(2) == ' '
    val isQuotedParameter: Boolean = record.startsWith("//             ")
    val hasName: Boolean = isStatement && isNameChar(record.charAt(2))
    val i: Int = record.indexOf(' ', 2)
    val i2: Int = (i until 71).find(j => isUpperChar(record.charAt(j))).getOrElse(-1)
    val i3: Int = record.indexOf(' ', i2)
    val i4: Int = (i3 until 71).find(j => isUpperChar(record.charAt(j))).getOrElse(-1)
    def sequenceNumber: String = record.takeRight(8)

    def name: String =
      if (hasName) {
        if (i - 2 > 8 || i == -1)
          throw new IllegalArgumentException("JCL Name field must be 8 characters or less")
        record.substring(2,i)
      } else ""

    def operation: String =
      if (isStatement) {
        if (i3 == -1)
          throw new IllegalArgumentException("JCL Operation field must be followed by a space")
        if (isQuotedParameter) ""
        else record.substring(i2, i3)
      } else ""

    def parameter: String =
      if (isQuotedParameter)
        record.substring(15,72).trim
      else if (isStatement) {
        val j0 = if (i4 != -1) i4
          else record.indices.find(i => isUpperChar(record.charAt(i))).getOrElse(72)
        var j = j0
        var q = false
        var sp = false
        var c: Char = 0
        while (j < 72 && !sp){
          c = record.charAt(j)
          if (!q) {
            if (c == '\'') q = true
            else if (c == ' ') sp = true
          } else {
            if (c == '\'') q = false
          }
          if (!sp) j += 1
        }
        record.substring(j0,j)
      } else ""
  }

  def getJCLSteps(jcl: String): Seq[JclStep] = {
    val statements = preprocess(jcl)
    var currentStep: Option[String] = None
    var ddStatements = ListBuffer.empty[String]
    val jclSteps= mutable.Map.empty[String, ListBuffer[String]]
    for(st <- statements if !st.isComment) {
      if(st.hasName && st.name.toUpperCase.startsWith("STEP")) {
        currentStep = Some(st.name)
        ddStatements = ListBuffer.empty[String]
        jclSteps.put(st.name, ddStatements)
      } else if(currentStep.isDefined) {
        ddStatements.append(st.record)
      }
    }
    jclSteps.map(pair => JclStep(pair._1, splitStatements(pair._2.mkString("\n")))).toSeq
  }

  def preprocess(jcl: String): Array[Statement] = {
    val buf = ArrayBuffer.empty[Statement]
    for (line <- jcl.linesIterator){
      val l1 = line.replaceFirst("""^\\\\""","//").padTo(80, ' ')
      buf.append(Statement(l1))
    }
    buf.toArray
  }

  def splitStatements(jcl: String): Seq[DDStatement] = {
    val buf = ListBuffer.empty[DDStatement]
    val builder = new DDStatementBuilder
    for (stmt <- preprocess(jcl)) {
      val param = stmt.parameter
      if (stmt.hasName) {
        if (builder.getName.nonEmpty) {
          buf.append(builder.build())
          builder.clear()
        }
        if (stmt.isContinued || param.endsWith(",")) {
          builder.setContinue(true)
          builder.addParams(param)
        } else {
          builder.setContinue(false)
          builder.accept(param)
        }

        builder.setName(stmt.name)
      } else if (builder.isContinued) {
        builder.addParams(param)
        builder.setContinue(stmt.isContinued)
      } else if (!builder.isContinued) {
        builder.accept(param)
        builder.setContinue(param.endsWith(","))
      }
    }

    if (builder.getName.nonEmpty) {
      buf.append(builder.build())
      builder.clear()
    }

    buf.toList
  }

  def filterParameters(params: String): String = {
    val parameters = ListBuffer.empty[String]
    def appendIfNeeded: (String, String) => Unit = (p: String, input: String) => {
      val index = input.indexOf(p  + "=")
      if(index != -1) {
        val filteredStr = input.substring(index)
        val commaIndex = filteredStr.indexOf(",")
        if(commaIndex != -1) {
          parameters.append(filteredStr.substring(0, commaIndex))
          //check for multiple parameters
          appendIfNeeded(p, filteredStr.substring(commaIndex + 1))
        } else {
          parameters.append(filteredStr)
        }
      }
    }
    appendIfNeeded("DSN", params)
    appendIfNeeded("LRECL", params)
    parameters.toSeq.mkString(",")
  }
}
