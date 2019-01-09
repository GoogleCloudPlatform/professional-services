/**
  Copyright 2019 Google LLC

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  https://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */

package com.google.cloud.pso.kafka2avro

import com.google.cloud.pso.kafka2avro.config.Kafka2AvroConfig
import com.google.cloud.pso.kafka2avro.demo.MyDemoType
import com.spotify.scio.ScioContext
import com.spotify.scio.testing.PipelineSpec
import com.spotify.scio.values.SCollection


class Object2KafkaSpec extends PipelineSpec {

  implicit val testConfig = Kafka2AvroConfig(
    "test broker",
    "test bucket",
    "test path",
    "test topic",
    5
  )

  "The extract step" should "create objects correctly" in {
    val testObjs = Object2Kafka.createDemoObjects(testConfig.numDemoObjects)
    runWithContext { implicit sc: ScioContext =>
      val objs: SCollection[MyDemoType] = Object2Kafka.extract
      objs should haveSize(5)
      objs should containInAnyOrder(testObjs)
    }
  }

  "The transform step" should "create strings correctly" in {
    // Three objects to test the transform step
    val obj1 = MyDemoType("a name", "a version", 11)
    val obj2 = MyDemoType("another name", "another version", 12)
    val obj3 = MyDemoType("the last name", "the last version", 13)

    val objs = List(obj1, obj2, obj3)
    val strings = objs.map(utils.Kafka2AvroUtils.object2String)

    runWithContext { sc: ScioContext =>
      val coll: SCollection[MyDemoType] = sc.parallelize(objs)
      val transformed: SCollection[String] = Object2Kafka.transform(coll)

      transformed should haveSize(3)
      transformed should containInAnyOrder(strings)
    }
  }

  "The createDemoObjects function" should "create proper lists" in {
    Object2Kafka.createDemoObjects(0) shouldEqual Nil
    Object2Kafka.createDemoObjects(-3) shouldEqual Nil
    Object2Kafka.createDemoObjects(7).length shouldEqual 7
    Object2Kafka.createDemoObjects(1).length shouldEqual 1
    Object2Kafka.createDemoObjects(11).length shouldEqual 11
  }
}
