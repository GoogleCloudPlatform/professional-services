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

/**
  *
  * @param dsn Data Set Name (DSNAME)
  * @param lrecl Record Length
  */
case class DataSetInfo(dsn: String = "",
                       lrecl: Int = -1) {
  private val dataSetName: String = {
    (dsn.indexOf('('), dsn.indexOf(')')) match {
      case (i,j) if i > -1 && j > i =>
        dsn.substring(0,i)
      case _ =>
        dsn
    }
  }

  val elementName: String = {
    (dsn.indexOf('('), dsn.indexOf(')')) match {
      case (i,j) if i > -1 && j > i =>
        dsn.substring(i+1,j)
      case _ =>
        ""
    }
  }

  val gdg: Boolean = {
    val i = dataSetName.lastIndexOf('.')
    i > -1 &&
      dataSetName.length - i == 9 &&
      dataSetName.charAt(i+1) == 'G' &&
      dataSetName.charAt(i+6) == 'V'
  }

  val generation: Option[String] = {
    if(gdg) {
      Option(dataSetName.substring(dataSetName.lastIndexOf('.'))).map(s => s.substring(1, 9))
    } else {
      None
    }
  }

  val pds: Boolean =
    elementName match {
      case s if s.length <= 8 && s.length > 1 && s.forall(_.isLetterOrDigit) =>
        true
      case _ =>
        false
    }

  private def dropLastQualifier(dsn: String): String = {
    val i = dsn.lastIndexOf('.')
    if (i > -1) dsn.substring(0,i) else dsn
  }

  def isBaseGDG: Boolean = gdg && generation.isDefined && elementName.isEmpty
  def isIndividualGDG: Boolean = gdg && generation.isDefined && elementName.nonEmpty

  def objectName: String = {
    if (pds) dataSetName + "/" + elementName
    else if (isBaseGDG) dropLastQualifier(dataSetName)
    else if (isIndividualGDG) dataSetName
    else dsn
  }

  override def toString: String = s"dataSetName=$dataSetName, elementName=$elementName, pds=$pds, gdg=$gdg, generation=${generation.orNull}"
}
