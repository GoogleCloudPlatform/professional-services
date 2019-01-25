/**
  * Copyright 2019 Google LLC
  *
  * Licensed under the Apache License, Version 2.0 (the "License");
  * you may not use this file except in compliance with the License.
  * You may obtain a copy of the License at
  *
  * https://www.apache.org/licenses/LICENSE-2.0
  *
  * Unless required by applicable law or agreed to in writing, software
  * distributed under the License is distributed on an "AS IS" BASIS,
  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  * See the License for the specific language governing permissions and
  * limitations under the License.
  */

package com.google.cloud.pso.kafka2avro

import com.google.cloud.pso.kafka2avro.demo.MyDemoType
import com.google.common.io.Files
import com.spotify.scio.ScioContext
import com.spotify.scio.testing.PipelineSpec
import com.spotify.scio.values.SCollection
import java.io.File
import org.apache.beam.sdk.transforms.windowing.IntervalWindow

/** Test the Kafka2Avro pipeline.
  *
  * The pipeline has three steps: extract, transformation and load.
  * Here we don't test the extract step, that would require having an input
  * similar to Kafka, probably by mocking the Kafka server.
  *
  * The other two steps are tested as follows:
  *  - The transform step should deserialize some objects
  *  - The load step should produce local Avro files
  *
  * We also test the windowing function used in the pipeline.
  */
class Kafka2AvroSpec extends PipelineSpec {

  // Let's generate 7 objects for this test
  private val NumDemoObjects: Int = 7

  "The transform step" should "deserialize some objs" in {
    val testObjs: List[MyDemoType] = Object2Kafka.createDemoObjects(NumDemoObjects)
    val strings: List[String] =
      testObjs.map(utils.Kafka2AvroUtils.object2String)

    runWithContext { implicit sc: ScioContext =>
      val coll: SCollection[String] = sc.parallelize(strings)

      val transformed: SCollection[(IntervalWindow, Iterable[MyDemoType])] =
        Kafka2Avro.transform(coll)

      transformed should haveSize(1)  // Just one window
      transformed.flatMap(_._2) should haveSize(strings.length)
      transformed.flatMap(_._2) should containInAnyOrder(testObjs)
    }
  }

  "The load step" should "write some objs to disk" in {
    // Create temp location for output testing
    val tmpDir: File = Files.createTempDir
    tmpDir.exists shouldEqual true

    // Check tmp dir is empty
    tmpDir.list shouldEqual Nil

    val testObjs: List[MyDemoType] = Object2Kafka.createDemoObjects(NumDemoObjects)

    runWithContext { implicit sc: ScioContext =>
      val coll: SCollection[MyDemoType] = sc.parallelize(testObjs)
      val windowed: SCollection[(IntervalWindow, Iterable[MyDemoType])] =
        Kafka2Avro.windowIn(coll)

      Kafka2Avro.load(windowed, tmpDir.getPath)
    }

    // These checks must be done once the pipeline has finished
    // Check if there is at least 1 avro file
    val avroList: Array[String] = tmpDir.list.filter(_.endsWith(".avro"))
    avroList.length should be > 0

    // Remove all files and check
    val allFilesRemoved: Boolean = tmpDir.listFiles.map(_.delete).forall(d => d)
    allFilesRemoved shouldEqual true
    // Delete tmp dir
    tmpDir.delete shouldEqual true
  }

  "The windowIn method" should "group objects together" in {
    val testObjs: List[MyDemoType] = Object2Kafka.createDemoObjects(NumDemoObjects)

    runWithContext { implicit sc: ScioContext =>
      val coll = sc.parallelize(testObjs)
      val windowed = Kafka2Avro.windowIn(coll)

      windowed should haveSize(1)  // Just one window
      windowed.flatMap(_._2) should haveSize(testObjs.length)
      windowed.flatMap(_._2) should containInAnyOrder(testObjs)
    }
  }
}
