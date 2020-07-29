/*
 * Copyright (C) 2020 Google Inc.
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

package com.google.cloud.pso.hashpipeline;

import com.google.gson.Gson;
import java.util.HashMap;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.DoFn.ProcessContext;
import org.apache.beam.sdk.transforms.DoFn.ProcessElement;
import org.apache.beam.sdk.values.KV;

public class KVtoJSONDoFn extends DoFn<KV<String, String>, String> {
  private Gson gson;

  @Setup
  public void setup() {
    this.gson = new Gson();
  }

  @ProcessElement
  public void processElement(ProcessContext c) {
    KV<String, String> elem = c.element();
    HashMap<String, String> map = new HashMap<String, String>();
    map.put("filename", elem.getKey());
    map.put("hashed_ssn", elem.getValue());

    c.output(this.gson.toJson(map));
  }
}
