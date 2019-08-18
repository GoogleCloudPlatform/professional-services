/*
 * Copyright 2019 Google LLC All rights reserved.
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

package com.google.cloud.example

import com.google.api.core.ApiFuture
import com.google.api.gax.batching.BatchingSettings
import com.google.cloud.example.protobuf._
import com.google.cloud.pubsub.v1.Publisher
import com.google.pubsub.v1.{ProjectTopicName, PubsubMessage}

import scala.util.Random

object CloudPublish extends Logging {
  case class Config(project: String = "myproject",
                    topic: String = "mytopic",
                    vmCount: Int = 1000,
                    hostCount: Int = 1000)

  val Parser: scopt.OptionParser[Config] =
    new scopt.OptionParser[Config]("CloudPublish") {
      head("CloudPublish", "0.1")

      opt[String]('p', "project")
        .action{(x, c) => c.copy(project = x)}
        .text("projectId is a string property")

      opt[String]('t', "topic")
        .action{(x, c) => c.copy(topic = x)}
        .text("topic is a string property")

      opt[Int]('n', "hostCount")
        .action{(x, c) => c.copy(hostCount = x)}
        .text("hostCount is a string property")

      opt[Int]('v', "vmCount")
        .action{(x, c) => c.copy(vmCount = x)}
        .text("vmCount is a string property")

      note("Publishes Metrics to Pubsub")

      help("help")
        .text("prints this usage text")
    }

  def main(args: Array[String]): Unit = {
    Parser.parse(args, Config()) match {
      case Some(config) =>
        run(config.project, config.topic, n = config.hostCount, vmCount = config.vmCount)
      case _ =>
        System.err.println(s"Failed to parse args: '${args.mkString(" ")}'")
    }
  }

  def run(projectId: String, topicId: String, n: Int, vmCount: Int): Unit = {
    val publisher = Publisher
      .newBuilder(ProjectTopicName.of(projectId, topicId))
      .setBatchingSettings(BatchingSettings.newBuilder()
        .setElementCountThreshold(32L)
        .setIsEnabled(true)
        .build())
      .build
    val t = System.currentTimeMillis()
    val rand = new Random()
    logger.info("Publishing")
    for (i <- 0 until n){
      val ip = s"10.${i%64}.${i%128}.${i%256}"
      val m: Metrics.Builder = Metrics.newBuilder()
        .setHostInfo(HostInfo.newBuilder()
          .setCloudRegion(s"r${i%3}")
          .setDc(s"dc${i%4}")
          .setHost(s"h$i")
          .setIp(ip)
          .setMdom("mdom")
          .setNodetype("nodetype")
          .setRack(s"r${i%256}"))
        .setTimestamp(t)
        .setHost(HostMetrics.newBuilder()
          .setCpuMetrics(CPUMetrics.newBuilder()
            .setCpu("cpu0")
            .setUsageGuest(0)
            .setUsageGuestNice(0)
            .setUsageIdle(0)
            .setUsageIowait(0)
            .setUsageIowait(0)
            .setUsageIrq(0)
            .setUsageNice(0)
            .setUsageSoftirq(0)
            .setUsageSteal(0)
            .setUsageSystem(0)
            .setUsageUser(0)
          )
          .setDisk(DiskMetrics.newBuilder()
            .setDevice("/dev/sda")
            .setFree(0)
            .setFstype("xfs")
            .setInodesFree(0)
            .setInodesTotal(0)
            .setInodesUsed(0)
            .setMode("mode1")
            .setPath("/")
            .setTotal(0)
            .setUsed(0)
            .setUsedPercent(0)
          )
          .setDiskio(DiskIOMetrics.newBuilder()
            .setIopsInProgress(0)
            .setIoTime(0)
            .setName("/dev/sda")
            .setReadBytes(0)
            .setReads(0)
            .setReadTime(0)
            .setWeightedIoTime(0)
            .setWriteBytes(0)
            .setWrites(0)
            .setWriteTime(0)
          )
          .setSystemMetrics(SystemMetrics.newBuilder()
            .setLoad1(rand.nextFloat())
            .setLoad5(rand.nextFloat())
            .setLoad15(rand.nextFloat())
            .setNCpus(16)
            .setNUsers(1)
            .setUptimeFormat("fmt")
          )
          .addNet(NetMetrics.newBuilder()
            .setBytesRecv(0)
            .setBytesSent(0)
            .setDropIn(0)
            .setDropOut(0)
            .setErrIn(0)
            .setErrOut(0)
            .setInterface("eth0")
            .setPacketsRecv(0)
          )
          .addNet2(NetMetrics2.newBuilder()
            .setIcmpInaddrmaskreps(0)
            .setIcmpInaddrmasks(0)
            .setIcmpIncsumerrors(0)
            .setIcmpIndestunreachs(0)
            .setIcmpInechoreps(0)
            .setIcmpInechos(0)
            .setIcmpInerrors(0)
            .setIcmpInmsgs(0)
            .setIcmpInparmprobs(0)
            .setIcmpInredirects(0)
            .setIcmpInsrcquenchs(0)
            .setIcmpIntimeexcds(0)
            .setIcmpIntimestampreps(0)
            .setIcmpIntimestamps(0)
            .setIcmpOutaddrmaskreps(0)
            .setIcmpOutaddrmasks(0)
            .setIcmpOutdestunreachs(0)
            .setIcmpOutechoreps(0)
            .setIcmpOutechos(0)
            .setIcmpOuterrors(0)
            .setIcmpOutmsgs(0)
            .setIcmpOutparmprobs(0)
            .setIcmpOutredirects(0)
            .setIcmpOutsrcquenchs(0)
            .setIcmpOuttimeexcds(0)
            .setIcmpOuttimestampreps(0)
            .setIcmpOuttimestamps(0)
            .setIcmpmsgIntype3(0)
            .setIcmpmsgIntype8(0)
            .setIcmpmsgOuttype(0)
            .setIcmpmsgOuttype0(0)
            .setInterface("eth0")
            .setIpDefaultttl(0)
            .setIpForwarding(0)
            .setIpForwdatagrams(0)
            .setIpFragcreates(0)
            .setIpFragfails(0)
            .setIpFragoks(0)
            .setIpInaddrerrors(0)
            .setIpIndelivers(0)
            .setIpIndiscards(0)
            .setIpInhdrerrors(0)
            .setIpInreceives(0)
            .setIpInunknownprotos(0)
            .setIpOutdiscards(0)
            .setIpOutnoroutes(0)
            .setIpOutrequests(0)
            .setIpReasmfails(0)
            .setIpReasmoks(0)
            .setIpReasmreqds(0)
            .setIpReasmtimeout(0)
            .setTcpActiveopens(0)
            .setTcpAttemptfails(0)
            .setTcpCurrestab(0)
            .setTcpIncsumerrors(0)
            .setTcpInerrs(0)
            .setTcpInsegs(0)
            .setTcpMaxconn(0)
            .setTcpOutrsts(0)
            .setTcpOutsegs(0)
            .setTcpPassiveopens(0)
            .setTcpRetranssegs(0)
            .setTcpRtoalgorithm(0)
            .setTcpRtomax(0)
            .setTcpRtomin(0)
            .setUdpIgnoredmulti(0)
            .setUdpIncsumerrors(0)
            .setUdpIndatagrams(0)
            .setUdpInerrors(0)
            .setUdpNoports(0)
            .setUdpOutdatagrams(0)
            .setUdpRcvbuferrors(0)
            .setUdpSndbuferrors(0)
            .setUdpliteIgnoredmulti(0)
            .setUdpliteIncsumerrors(0)
            .setUdpliteIndatagrams(0)
            .setUdpliteInerrors(0)
            .setUdpliteNoports(0)
            .setUdpliteOutdatagrams(0)
            .setUdpliteRcvbuferrors(0)
            .setUdpliteSndbuferrors(0)
          )
        )

      for (j <- 0 until vmCount) {
        m.addVmBuilder()
          .setVmid(s"vm$j")
          .setCpu(VMCPUMetrics.newBuilder()
            .setAggregateCputime(0)
            .setAggregateSystemTime(0)
            .setAggregateUserTime(0)
            .setCpuDataCputime(0)
            .setCpuDataCputimePercent(rand.nextFloat()))
          .setDisk(VMDiskMetrics.newBuilder()
            .setDiskName(s"/dev/sda")
            .setErrors(0)
            .setReadBytes(0)
            .setReadReq(0)
            .setWriteBytes(0)
            .setWriteReq(0))
          .setMem(VMMemMetrics.newBuilder()
            .setFreeMemory(0)
            .setMemoryUtil(0)
            .setTotalMemory(0)
          )
          .setNet(VMNetMetrics.newBuilder()
            .setInterfaceName("eth0")
            .setRxBytes(0)
            .setRxDrop(0)
            .setRxErrs(0)
            .setRxPackets(0)
            .setTxBytes(0)
            .setTxDrop(0)
            .setTxErrs(0)
            .setTxPackets(0)
          )
          .setIp(ip)
      }
      publish(m.build, publisher)

      if (i % 100 == 0 & i > 0) {
        logger.info(s"published $i of $n")
      }
    }
    logger.info("Finished publishing")
    publisher.shutdown()
  }

  def publish(m: Metrics, publisher: Publisher): ApiFuture[String] = {
    publisher.publish(PubsubMessage.newBuilder()
      .setData(m.toByteString)
      .build())
  }
}
