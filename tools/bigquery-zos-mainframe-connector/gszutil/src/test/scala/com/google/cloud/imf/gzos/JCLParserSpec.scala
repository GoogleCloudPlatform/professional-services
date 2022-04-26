/*
 * Copyright 2020 Google LLC All Rights Reserved.
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

import com.google.cloud.imf.gzos.JCLParser.DDStatement
import org.scalatest.flatspec.AnyFlatSpec

class JCLParserSpec extends AnyFlatSpec {
  "JCL" should "parse" in {
    val example = """\\INFILE DD DSN=HLQ.LOAD1,DISP=SHR,LRECL=123"""
    val stmts = JCLParser.splitStatements(example)
    val expected = List(DDStatement("INFILE",123,List("HLQ.LOAD1")))
    assert(stmts == expected)
  }

  it should "multi" in {
    val example =
      """\\INFILE DD DSN=HLQ.LOAD1,DISP=SHR,LRECL=123
        |\\       DD DSN=HLQ.LOAD2,DISP=SHR""".stripMargin
    val actual = JCLParser.splitStatements(example)
    val expected = List(DDStatement("INFILE",123,List("HLQ.LOAD1","HLQ.LOAD2")))
    assert(actual == expected)
  }

  it should "quoted" in {
    val example = """\\INFILE DD DSN='gs://bucket/prefix/HLQ.LOAD1',LRECL=123"""
    val actual = JCLParser.splitStatements(example)
    val expected = List(DDStatement("INFILE",123,List("gs://bucket/prefix/HLQ.LOAD1")))
    assert(actual == expected)
  }

  it should "continued" in {
    val example =
      """\\INFILE DD DSN='gs://long-bucket-name/long_object_name_prefix/HLQ.LONG.
        |\\             DSN.LOAD1',LRECL=123""".stripMargin
    val actual = JCLParser.splitStatements(example)
    val expected = List(DDStatement("INFILE",123,List("gs://long-bucket-name/long_object_name_prefix/HLQ.LONG.DSN.LOAD1")))
    assert(actual == expected)
  }

  it should "continued 2" in {
    val example =
      """\\INFILE DD DSN=HLQ.DSN.LOAD1,
        |\\          LRECL=41""".stripMargin
    val actual = JCLParser.splitStatements(example)
    val expected = List(DDStatement("INFILE",41,List("HLQ.DSN.LOAD1")))
    assert(actual == expected)
  }

  it should "continued 3" in {
    val example =
      """\\INFILE DD DSN=HLQ.DSN.LOAD1,
        |\\          SPACE=(0,0)""".stripMargin
    val actual = JCLParser.splitStatements(example)
    val expected = List(DDStatement("INFILE",-1,List("HLQ.DSN.LOAD1")))
    assert(actual == expected)
  }

  it should "get JCL steps" in {
    val jcl =
      """
        |//TD0523GX JOB (TDBP),
        |//             MDS,
        |//             CLASS=R,
        |//             MSGCLASS=9,NOTIFY=&SYSUID,
        |//             SCHENV=GCS,
        |//             MSGLEVEL=(1,1)
        |//*
        |//*AVRS     OUTPUT DEST=$GO,DEFAULT=YES,JESDS=ALL,CLASS=8
        |//*
        |//          SET CC1=US
        |//          SET COQUAL=MDS.
        |//          SET JOBCHK=TD0523G
        |//          SET CC=R6.
        |//*
        |//JOBLIB   DD DSN=WM.LINKLIB,DISP=SHR
        |//         DD DSN=WM.SP.LINKLIB,DISP=SHR
        |//*
        |//LIBSRCH  JCLLIB ORDER=(WM.R6.US.DBA.PROCLIB,WM.PROCLIB,
        |//         WM.DATAWHSE.PROCLIB)
        |//*
        |//* RUN THROUGH JCLPREP ON 04/20/99 AT 08.56.11 BY RRBHATK
        |//*---------------------------------------------------------------------
        |//*
        |//* JOB DESCRIPTION: UPDATE COLUMNS PRES-INSTK-STR-CNT
        |//*                   AND LOST-SALES-QTY ON WM_SALES.ITEM_WKLY_INV.
        |//*
        |//*RAVIPRE  JCLLIB ORDER=(WM.PROCLIB)
        |//*---------------------------------------------------------------------
        |//* STEP01   : BTEQ - DROP MLOAD PROCESSING TABLES TO CATER FOR PREVIOUS
        |//*            ABORTED RUN.
        |//* RESTARTABLE : YES
        |//*---------------------------------------------------------------------
        |//STEP01   EXEC BQSQL,ENVPROJ=EDWLOAD
        |//KEYFILE  DD   DSN=N01.DW.GCLOUD.KEYFILE.DATA.LOADS,DISP=SHR
        |//DD01     DD DSN=S01.R6.DBC.WM.PROD.LOGONS(TD0523GQ),DISP=SHR
        |//         DD DSN=S01.R6.DBC.WM.PROD.PARM(TD0523W1),DISP=SHR
        |//*-------------------------------------------------------------------
        |//* STEP02   : MLOAD - UPDATE COUNT COLUMNS ON ITEM_WKLY_INV
        |//* RESTARTABLE : YES
        |//*-------------------------------------------------------------------
        |//STEP02   EXEC BQMLOAD,ENVPROJ=EDWLOAD
        |//KEYFILE  DD   DSN=N01.DW.GCLOUD.KEYFILE.DATA.LOADS,DISP=SHR
        |//INVFILE  DD DSN=N01.R6.MDS.TD0518W.SENARY,DISP=SHR
        |//DD01     DD DSN=S01.R6.DBC.WM.PROD.LOGONS(TD0523GQ),DISP=SHR
        |//         DD DSN=S01.R6.DBC.WM.PROD.PARM(TD0523W2),DISP=SHR
        |//*JOBNAME  DD DSN=N01.R6.MDS.JOB.INPUT(TD0523NJ),DISP=SHR
        |//*---------------------------------------------------------------------
        |//* STEP03   : BTEQ - UPDATE TABLE STATUS
        |//* RESTARTABLE : YES
        |//*---------------------------------------------------------------------
        |//STEP03   EXEC BQSQL,ENVPROJ=EDWLOAD
        |//KEYFILE  DD   DSN=N01.DW.GCLOUD.KEYFILE.DATA.LOADS,DISP=SHR
        |//DD01     DD DSN=S01.R6.DBC.WM.PROD.LOGONS(TD0523GQ),DISP=SHR
        |//         DD DSN=S01.R6.DBC.WM.PROD.PARM(TD0523N1),DISP=SHR
        |//*--------------------------------------------------------------------
        |//* STEP04 - IEFBR14  DELETE WORK FILE(S)
        |//* RESTARTABLE  : YES
        |//*--------------------------------------------------------------------
        |//STEP04   EXEC PGM=IEFBR14
        |//DD1      DD DSN=N01.R6.MDS.TD0518W.SENARY,
        |//             DISP=(MOD,DELETE,DELETE),
        |//             SPACE=(0,0)
        |//*---------------------------------------------------------------------
        |//**********************************************************************
        |//* CHANGE HISTORY:
        |//* VERSION DATE       USERID  DESCRIPTION
        |//*======= ========== ======= ====================
        |//*V1.0    07/27/2020 TCS     TD2C MIGRATION
        |""".stripMargin

    val steps = JCLParser.getJCLSteps(jcl)
    assert(steps.size == 4)
    assert(steps.exists(_.stepName == "STEP01"))
    assert(steps.find(_.stepName == "STEP01").map(_.ddStatements).map(_.size).contains(2))
  }
}
