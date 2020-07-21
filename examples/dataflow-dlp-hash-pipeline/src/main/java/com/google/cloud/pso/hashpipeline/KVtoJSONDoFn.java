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

import java.util.HashMap;

import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.DoFn.ProcessContext;
import org.apache.beam.sdk.transforms.DoFn.ProcessElement;
import org.apache.beam.sdk.values.KV;


import com.google.gson.Gson;

public class KVtoJSONDoFn extends DoFn<KV<String, String>, String>{
	@ProcessElement
	public void processElement(ProcessContext c) {
		KV<String, String> elem = c.element();
		HashMap<String, String> map = new HashMap<String, String>();
		map.put("filename", elem.getKey());
		map.put("hashed_ssn", elem.getValue());
		Gson gson = new Gson();
		c.output(gson.toJson(map));
	}
}
