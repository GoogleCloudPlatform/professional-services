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

import scopt.OptionParser

object DataflowFlexTemplateRunOptionParser extends OptionParser[DataflowFlexTemplateRunConfig]("run") with ArgParser[DataflowFlexTemplateRunConfig]{
  override def parse(args: Seq[String], env: Map[String, String]): Option[DataflowFlexTemplateRunConfig] =
    parse(args, DataflowFlexTemplateRunConfig())

  head("publish", Bqsh.UserAgent)

  help("help")
    .text("prints this usage text")

  arg[String]("JOB_NAME")
    .required()
    .text("Unique name to assign to the job.")
    .action((x, c) => c.copy(jobName = x))

  opt[String]("project")
    .required()
    .text("""Google Cloud project ID""")
    .action((x, c) => c.copy(projectId = x))

  opt[String]("template-file-gcs-location")
    .text("""Google Cloud Storage location of the flex template to run. (Must be a URL beginning with 'gs://'.)""")
    .action((x, c) => c.copy(templateFileGcsLocation = x))

  opt[String]("dataflow-kms-key")
    .text("""Cloud KMS key to protect the job resources.""")
    .action((x, c) => c.copy(kmsKey = x))

  opt[String]("network")
    .text("""Compute Engine network for launching instances to run your pipeline.""")
    .action((x, c) => c.copy(network = x))

  opt[String]("subnetwork")
    .text("""Compute Engine subnetwork for launching instances to run your pipeline.""")
    .action((x, c) => c.copy(subnetwork = x))

  opt[String]("service-account-email")
    .text("""Service account to run the workers as.""")
    .action((x, c) => c.copy(serviceAccount = x))

  opt[String]("region")
    .text("""Region ID of the job's regional endpoint. Defaults to 'us-central1'.""")
    .action((x, c) => c.copy(region = x))

  opt[String]("worker-region")
    .text("""Region to run the workers in.""")
    .action((x, c) => c.copy(workerRegion = x))

  opt[String]("worker-zone")
    .text("""Zone to run the workers in.""")
    .action((x, c) => c.copy(workerZone = x))

  opt[String]("worker-machine-type")
    .text("""Type of machine to use for workers. Defaults to server-specified.""")
    .action((x, c) => c.copy(workerMachineType = x))

  opt[Map[String, String]]("parameters")
    .text("""Parameters to pass to the job.""")
    .action((x, c) => c.copy(parameters = x))

  opt[Map[String, String]]("additional-user-labels")
    .text("""Additional user labels to pass to the job.""")
    .action((x, c) => c.copy(labels = x))

  opt[Seq[String]]("additional-experiments")
    .text("""Additional experiments to pass to the job.""")
    .action((x, c) => c.copy(experiments = x))

  opt[Int]("max-workers")
    .text("""Maximum number of workers to run.""")
    .action((x, c) => c.copy(maxWorkers = x))

  opt[Int]("num-workers")
    .text("""Initial number of workers to use.""")
    .action((x, c) => c.copy(numWorkers = x))

}
