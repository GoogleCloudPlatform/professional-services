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

package com.google.cloud.pso.kafka2avro.utils

import com.google.cloud.pso.kafka2avro.config.Kafka2AvroConfig
import com.google.cloud.pso.kafka2avro.demo.MyDemoType
import org.scalatest.Matchers._
import org.scalatest.WordSpec
import pureconfig.error.ConfigReaderFailures
import pureconfig.generic.auto._


class Kafka2AvroUtilsSpec extends WordSpec {
  "The object2String and string2object methods" should {
    "reconstruct a case class object" in {
      val o = MyDemoType("one", "two", 3)
      val s: String = Kafka2AvroUtils.object2String(o)
      Kafka2AvroUtils.string2object[MyDemoType](s) shouldEqual o
    }

    "reconstruct a complex type" in {
      val o = Some(List(1,2,3,5))
      val s: String = Kafka2AvroUtils.object2String(o)
      Kafka2AvroUtils.string2object[Option[List[Int]]](s) shouldEqual o
    }
  }
}
