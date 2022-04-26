package com.google.cloud.load

import com.google.cloud.imf.util.Logging

object GrecvLoadTest extends Logging {

  def main(args: Array[String]): Unit = {
    GrecvLoadTestConfigParser.parse(args) match {
      case Some(cfg) =>
        logger.info(s"Starting Load Test")
        val service = cfg.testCase.toLowerCase match {
          case "export" => new ExportLoadTest(cfg)
          case "export_and_import" => new ExportAndImportLoadTest(cfg)
          case "import" => new ImportLoadTest(cfg)
          case "export_and_import_with_load" => new ExportAndImportWithBqLoadTest(cfg)
          case _ => throw new Error("wrong test case")
        }
        service.run
      case _ =>
        Console.err.println(s"Unabled to parse args '${args.mkString(" ")}'")
        System.exit(1)
    }
  }
}
