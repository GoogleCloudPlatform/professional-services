package com.google.cloud.gzos

import com.google.cloud.imf.gzos.DataSetInfo
import org.scalatest.flatspec.AnyFlatSpec

class DataSetInfoSpec extends AnyFlatSpec {

  case class ExpectedDataSetInfo(elementName: String,
                                 pds: Boolean,
                                 gdg: Boolean,
                                 objectName: String,
                                 generation: Option[String])

  val DsnToExpectedDataSetInfo = Map(
    "N1.R6.MDS" -> ExpectedDataSetInfo("", false, false, "N1.R6.MDS", None),
    "N1.R6.MDS(0)" -> ExpectedDataSetInfo("0", false, false, "N1.R6.MDS(0)", None),
    "N1.R6.MDS(TD11)" -> ExpectedDataSetInfo("TD11", true, false, "N1.R6.MDS/TD11", None),
    "N1.R6.MDS.G1234V56" -> ExpectedDataSetInfo("", false, true, "N1.R6.MDS", Some("G1234V56")),
    "N01.R6.US.MDS.TD345.POS.SENARY.G0001V00(-3)" -> ExpectedDataSetInfo("-3", false, true, "N01.R6.US.MDS.TD345.POS.SENARY.G0001V00", Some("G0001V00")),
    "N01.R6.US.MDS.TD345.POS.SENARY.G0001V00" -> ExpectedDataSetInfo("", false, true, "N01.R6.US.MDS.TD345.POS.SENARY", Some("G0001V00")),
  )

  "DataSetInfoSpec" should "match expected inputs" in {
    DsnToExpectedDataSetInfo.foreach(dsnToExpectedDs =>{
      val actualDs = DataSetInfo(dsnToExpectedDs._1)
      assert(actualDs.elementName == dsnToExpectedDs._2.elementName)
      assert(actualDs.gdg == dsnToExpectedDs._2.gdg)
      assert(actualDs.pds == dsnToExpectedDs._2.pds)
      assert(actualDs.generation == dsnToExpectedDs._2.generation)
      assert(actualDs.objectName == dsnToExpectedDs._2.objectName)
    })
  }
}
