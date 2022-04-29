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

package com.google.cloud.imf.util.stats

import com.google.api.client.json.jackson2.JacksonFactory
import com.google.api.services.bigquery.model.Job
import com.google.cloud.bqsh.BQ.SchemaRowBuilder

import scala.util.Try

object JobStats {
  def forJob(j: Job): Option[JobStats] = {
    if (j == null) return None
    Option(JobStats(j.getJobReference.getProjectId,
      j.getJobReference.getLocation,
      j.getJobReference.getJobId,
      Try(JacksonFactory.getDefaultInstance.toString(j)).getOrElse("")
    ))
  }

  def put(s: JobStats, row: SchemaRowBuilder): Unit = {
    row
      .put("bq_job_project",s.project)
      .put("bq_job_location",s.location)
      .put("bq_job_id",s.jobId)
      .put("job_json",s.json)
  }

  def report(s: JobStats): String =
    s"""project: ${s.project}
       |location: ${s.location}
       |job id: ${s.jobId}
       |""".stripMargin
}
case class JobStats(project: String,
                    location: String,
                    jobId: String,
                    json: String)
