package com.google.cloud.load

import com.google.cloud.bqsh.{Bqsh, GlobalConfig}
import scopt.OptionParser

object GrecvLoadTestConfigParser extends OptionParser[GRecvLoadTestConfig]("loadTest") {
  def parse(args: Array[String]): Option[GRecvLoadTestConfig] = parse(args.toIndexedSeq, GRecvLoadTestConfig())

  head("loadTest", Bqsh.UserAgent)

  help("help").text("prints this usage text")

  opt[String]("target_host")
    .optional
    .action { (x, c) => c.copy(targetHost = x) }
    .text("Bind Address (default: 127.0.0.1)")

  opt[Int]('p', "target_port")
    .optional
    .action { (x, c) => c.copy(targetPort = x) }
    .text("Bind Port (default: 51771)")

  opt[String]("copybook_path")
    .optional()
    .text("path to copybook")
    .action((x, c) => c.copy(copybookPath = x))

  opt[String]("sql_path")
    .optional()
    .text("path to sql for export and exportAndImport cases")
    .action((x, c) => c.copy(sqlPath = x))

  opt[String]("import_file_path")
    .optional()
    .text("path to import file for import test case")
    .action((x, c) => c.copy(importFilePath = x))

  opt[String]("bucket")
    .optional()
    .text("gcs bucket for load test")
    .action((x, c) => c.copy(bucket = x))

  opt[String]("project_id")
    .text(GlobalConfig.projectIdText)
    .action((x, c) => c.copy(projectId = x))

  opt[String]("location")
    .text(GlobalConfig.locationText)
    .action((x, c) => c.copy(location = x))

  opt[Int]("number_requests")
    .optional()
    .action { (x, c) => c.copy(numberOfRequests = x) }
    .text("number of requests")

  opt[String]("export_run_mode")
    .optional
    .text("storage_api or parallel for export and exportAndImport cases")
    .action((x, c) => c.copy(exportRunMode = x))

  opt[Int]("keepAliveTimeInSeconds")
    .optional()
    .action { (x, c) => c.copy(keepAliveTimeInSeconds = x) }
    .text("(optional) keep alive timeout in seconds for http channel. (default: 480 seconds)")

  opt[Int]("timeOutMinutes")
    .optional()
    .action { (x, c) => c.copy(timeoutMinutes = x) }
    .text("(optional) Timeout in minutes for GRecvExportGrpc call. (default for GCS: 30 minutes)")

  opt[Int]("number_threads")
    .optional()
    .action { (x, c) => c.copy(numberThreads = x) }
    .text("number of threads used for load test")

  opt[String]("test_case")
    .optional
    .text("Possible values: export, import, export_and_import")
    .action((x, c) => c.copy(testCase = x))

  opt[Boolean]("use_ssl")
    .text("default false")
    .action((x, c) => c.copy(useSsl = x))

  opt[String]("bq_schema_path")
    .optional()
    .text("path to bq schema used for load test case")
    .action((x, c) => c.copy(bqSchemaPath = x))
}
