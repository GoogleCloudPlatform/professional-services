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

package com.google.cloud.imf.gzos

import java.net.URI

import org.scalatest.flatspec.AnyFlatSpec

class CloudDataSetSpec extends AnyFlatSpec {
  "CloudDataSet" should "object name" in {
    val uri = new URI("gs://bucket/prefix")
    val ds = DataSetInfo("HLQ.DATASET")
    val name = CloudDataSet.buildObjectName(uri, ds)
    assert(name == "prefix/HLQ.DATASET")
  }

  it should "pds object name" in {
    val uri = new URI("gs://bucket/prefix")
    val ds = DataSetInfo("HLQ.DATASET(MBR)")
    val name = CloudDataSet.buildObjectName(uri, ds)
    assert(name == "prefix/HLQ.DATASET/MBR")
  }

  it should "gdg object name for base GDG" in {
    val uri = new URI("gs://bucket/prefix")
    val ds = DataSetInfo("HLQ.DATASET.G0001V00")
    val name = CloudDataSet.buildObjectName(uri, ds)
    assert(ds.gdg)
    assert(name == "prefix/HLQ.DATASET")
  }

  it should "gdg object name for individual GDG" in {
    val uri = new URI("gs://bucket/prefix")
    val ds = DataSetInfo("HLQ.DATASET.G0001V00(+0)")
    val name = CloudDataSet.buildObjectName(uri, ds)
    assert(ds.gdg)
    assert(name == "prefix/HLQ.DATASET.G0001V00")
  }
}
