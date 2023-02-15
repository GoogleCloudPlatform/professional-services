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
package com.google.cloud.bqsh.cmd

import com.google.api.client.json.jackson2.JacksonFactory
import com.google.cloud.bqsh.{ArgParser, Command, DataflowFlexTemplateRunConfig, DataflowFlexTemplateRunOptionParser}
import com.google.cloud.imf.gzos.MVS
import com.google.cloud.imf.util.{Logging, Services}
import com.google.api.services.dataflow.Dataflow
import com.google.api.services.dataflow.model.{FlexTemplateRuntimeEnvironment, LaunchFlexTemplateParameter, LaunchFlexTemplateRequest}

import scala.jdk.CollectionConverters.{MapHasAsJava, SeqHasAsJava}

object DataflowFlexTemplateRun extends Command[DataflowFlexTemplateRunConfig] with Logging {
  override val name: String = "dataflow flex-template run"
  override val parser: ArgParser[DataflowFlexTemplateRunConfig] = DataflowFlexTemplateRunOptionParser

  override def run(config: DataflowFlexTemplateRunConfig, zos: MVS, env: Map[String, String]): Result = {
    val dataflow: Dataflow = Services.dataflow(zos.getCredentialProvider().getCredentials)

    val environment = new FlexTemplateRuntimeEnvironment()

    if (config.workerZone.nonEmpty)
      environment.setWorkerZone(config.workerZone)
    else if (config.workerRegion.nonEmpty)
      environment.setWorkerRegion(config.workerRegion)

    if (config.serviceAccount.nonEmpty)
      environment.setServiceAccountEmail(config.serviceAccount)
    if (config.kmsKey.nonEmpty)
      environment.setKmsKeyName(config.kmsKey)
    if (config.experiments.nonEmpty)
      environment.setAdditionalExperiments(config.experiments.asJava)
    if (config.workerMachineType.nonEmpty)
      environment.setMachineType(config.workerMachineType)
    if (config.tempLocation.nonEmpty)
      environment.setTempLocation(config.tempLocation)
    if (config.subnetwork.nonEmpty)
      environment.setSubnetwork(config.subnetwork)
    else if (config.network.nonEmpty)
      environment.setNetwork(config.network)

    if (config.numWorkers > 0)
      environment.setNumWorkers(config.numWorkers)

    val parameters = new java.util.HashMap[String,String](config.parameters.asJava)
    parameters.put("usePublicIps", "false")
    if (config.maxWorkers > 0)
      parameters.put("maxNumWorkers", config.maxWorkers.toString)
    if (config.serviceAccount.nonEmpty)
      parameters.put("serviceAccount", config.serviceAccount)

    val param = new LaunchFlexTemplateParameter()
      .setEnvironment(environment)
      .setContainerSpec(null)
      .setContainerSpecGcsPath(config.templateFileGcsLocation)
      .setJobName(config.jobName)
      .setParameters(parameters)

    val request = new LaunchFlexTemplateRequest()
      .setLaunchParameter(param)

    System.out.println("LaunchFlexTemplateRequest:")
    System.out.println(JacksonFactory.getDefaultInstance.toPrettyString(request))

    val response = dataflow.projects().locations().flexTemplates().launch(config.projectId, config.region, request).execute()

    System.out.println("LaunchFlexTemplateResponse:")
    System.out.println(JacksonFactory.getDefaultInstance.toPrettyString(response))

    Result.Success
  }
}
