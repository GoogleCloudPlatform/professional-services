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

import com.google.api.client.json.jackson2.JacksonFactory
import com.google.api.services.compute.model.Instance
import org.scalatest.FlatSpec

import scala.collection.mutable.ArrayBuffer

class ApiQuerySpec extends FlatSpec {
  def getIps(instance: Instance, buf: ArrayBuffer[String]): ArrayBuffer[String] = {
    import scala.collection.JavaConverters._
    for (iface <- instance.getNetworkInterfaces.asScala){
      buf.append(iface.getNetworkIP)
    }
    buf
  }

  def getIps(instances: Seq[Instance], buf: ArrayBuffer[String]): ArrayBuffer[String] = {
    for (instance <- instances)
      getIps(instance, buf)
    buf
  }

  def ts(minutes: Int, offset: Int): String = {
    val now = LocalDateTime.now().atOffset(ZoneOffset.ofHours(-8))
    val timestamp = now.minusMinutes(minutes).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME)
    timestamp
  }

  def print(instance: Instance): String = {
    val now = LocalDateTime.now
    import scala.collection.JavaConverters._
    s"""${instance.getName}
       | ip:   ${instance.getNetworkInterfaces.asScala.head.getNetworkIP}
       | ts:   ${instance.getCreationTimestamp} (${ApiQuery.getAge(instance.getCreationTimestamp,
      now)} s)
       | sa:   ${instance.getServiceAccounts.asScala.headOption.map(_.getEmail).getOrElse("no " +
      "service " +
      "account")}
       |""".stripMargin

  }

  def print(instances: Seq[Instance]): Unit =
    for (instance <- instances)
      System.out.println(print(instance))

  private val Project = sys.env("PROJECT")
  private val Zone = sys.env("ZONE")
  private val Region = sys.env.getOrElse("REGION", Zone.dropRight(2))
  private val ServiceAccount = sys.env.getOrElse("SA","")
  private val Ip = sys.env.getOrElse("IP","")
  private val MaxAgeSeconds = sys.env.getOrElse("MAXAGE","300").toInt
  private val InstanceName = sys.env.getOrElse("INSTANCE_NAME","")

  "ApiQuery" should "list dataproc instances" in {
    val instances = ApiQuery.listDataprocInstances(Region, Project)
    assert(instances.nonEmpty)
  }

  it should "get instance by ip" in {
    val instances = ApiQuery.getComputeNode(Project, Zone, ServiceAccount, Ip).toArray.toSeq
    assert(instances.nonEmpty)
  }

  it should "get instances by age" in {
    val instances = ApiQuery.getInstancesByAge(Project, Zone, MaxAgeSeconds).toArray.toSeq
    assert(instances.nonEmpty)
  }

  it should "get instance by name" in {
    val instance = ApiQuery.getInstance(Project, Zone, InstanceName)
    assert(instance.isDefined)
    System.out.println(JacksonFactory.getDefaultInstance.toPrettyString(instance.get))
    assert(AuthService.hasIp("10.1.0.27", instance.get))
  }
}
