/*
 *  Copyright 2020 Google Inc. All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
package com.google.cloud.dataproc.auth
import java.time.{LocalDateTime, ZoneOffset}
import java.time.format.DateTimeFormatter
import java.time.temporal.{ChronoUnit, TemporalUnit}

import com.google.api.services.compute.model.Instance
import com.google.api.services.dataproc.model.Cluster

import scala.collection.mutable.ArrayBuffer
import scala.collection.JavaConverters._

/**
 *
 */
object ApiQuery {
  val ClusterFields: Seq[String] = Seq("projectId", "clusterName", "config", "labels", "status",
    "clusterUuid")

  val ComputeFields: Seq[String] = Seq(
    "name", "zone", "networkInterfaces",
    "metadata", "labels", "hostname")

  val ClusterLabel = "dataproc-cluster-name"

  object ComputeFilter {
    final val Running: ComputeFilter = ComputeFilter(status = "RUNNING")
    def forCluster(clusterName: String): ComputeFilter =
      Running.copy(labelName = ClusterLabel,
                    labelValue = clusterName)

  }

  case class ComputeFilter(name: String = "",
                           id: String = "",
                           labelName: String = "",
                           labelValue: String = "",
                           status: String = "") {
    override def toString: String = {
      Seq(Option(status).filter(_.nonEmpty).map(x => s"(status = $x)"),
        Option(name).filter(_.nonEmpty).map(x => s"(name = $x)"),
        Option(id).filter(_.nonEmpty).map(x => s"(id = $x)"),
        Option((labelName,labelValue)).filter(x => x._1.nonEmpty && x._2.nonEmpty)
          .map(x => s"(labels.${x._1} = ${x._2})")).flatten.mkString(" AND ")
    }
  }

  case class ClusterFilter(clusterName: String = "",
                           labelName: String = "",
                           labelValue: String = "",
                           state: String = "ACTIVE") {
    override def toString: String = {
      Seq(Option(s"(status.state = $state)"),
          Option(clusterName).filter(_.nonEmpty).map(x => s"(clusterName = $x)"),
          Option((labelName,labelValue)).filter(x => x._1.nonEmpty && x._2.nonEmpty)
            .map(x => s"(labels.${x._1} = ${x._2})")).flatten.mkString(" AND ")
    }
  }

  def listDataprocInstances(region: String, projectId: String): Seq[Instance] = {
    listClusters(region, projectId)
      .foldLeft(new ArrayBuffer[Instance](128)){(a,b) => getComputeNodes(b,a)}
      .toArray.toSeq
  }

  def listClusters(region: String,
                   projectId: String,
                   filter: ClusterFilter = ClusterFilter(),
                   buf: ArrayBuffer[Cluster] = new ArrayBuffer[Cluster](128))
  : ArrayBuffer[Cluster] = {
    val req = Client.dataproc.projects.regions.clusters.list(projectId, region)
      .setFilter(filter.toString)
    var pageToken = Option("")
    while (pageToken.isDefined) {
      req.setPageToken(pageToken.filterNot(_.isEmpty).orNull)
      val listResp = req.execute
      pageToken = Option(listResp.getNextPageToken)
      for (cluster <- listResp.getClusters.asScala){
        cluster.setFactory(Client.jsonFactory)
        buf.append(cluster)
      }
    }
    buf
  }

  def getComputeNodes(cluster: Cluster,
                      buf: ArrayBuffer[Instance] = new ArrayBuffer[Instance](128))
  : ArrayBuffer[Instance] = {
    val projectId = cluster.getProjectId
    val zone = cluster.getConfig.getGceClusterConfig.getZoneUri.split("/").last
    listNodes(projectId, zone, ComputeFilter.forCluster(cluster.getClusterName), buf)
  }

  def getInstance(projectId: String,
                  zone: String,
                  instanceName: String,
                  buf: ArrayBuffer[Instance] = new ArrayBuffer[Instance](1))
  : Option[Instance] = {
    val filter = ComputeFilter.Running.copy(name = instanceName)
    listNodes(projectId, zone, filter).headOption
  }

  def getInstancesByAge(projectId: String,
                        zone: String,
                        maxAgeSeconds: Long,
                        buf: ArrayBuffer[Instance] = new ArrayBuffer[Instance](128))
  : Array[Instance] = {
    val now = LocalDateTime.now
    listNodes(projectId, zone, ComputeFilter.Running, buf).toArray
      .filter{x => getAge(x,now) < maxAgeSeconds}
  }

  def getComputeNode(projectId: String,
                     zone: String,
                     serviceAccount: String,
                     ipAddress: String,
                     buf: ArrayBuffer[Instance] = new ArrayBuffer[Instance](128))
  : Array[Instance] =
    listNodes(projectId, zone, ComputeFilter.Running, buf).toArray
      .filter{x =>
        x.getNetworkInterfaces.asScala.exists(_.getNetworkIP == ipAddress) &&
        x.getServiceAccounts.asScala.exists(_.getEmail == serviceAccount)
      }

  def getAge(instance: Instance, now: LocalDateTime = LocalDateTime.now()): Long =
    getAge(instance.getCreationTimestamp, now)

  def getAge(creationTimestamp: String, now: LocalDateTime): Long =
    LocalDateTime
      .from(DateTimeFormatter.ISO_OFFSET_DATE_TIME.parse(creationTimestamp))
      .until(now, ChronoUnit.SECONDS)

  def listNodes(project: String,
                zone: String,
                filter: ComputeFilter = ComputeFilter(),
                buf: ArrayBuffer[Instance] = new ArrayBuffer[Instance](128))
  : ArrayBuffer[Instance]
  = {
    val req = Client.compute.instances.list(project, zone)
      .setFilter(filter.toString)
    var pageToken = Option("")
    while (pageToken.isDefined) {
      req.setPageToken(pageToken.filterNot(_.isEmpty).orNull)
      val listResp = req.execute
      pageToken = Option(listResp.getNextPageToken)
      for (instance <- listResp.getItems.asScala){
        instance.setFactory(Client.jsonFactory)
        buf.append(instance)
      }
    }
    buf
  }

}
