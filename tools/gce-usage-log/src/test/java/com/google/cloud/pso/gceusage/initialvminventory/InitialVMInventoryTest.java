/*
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.google.cloud.pso.gceusage.initialvminventory;

import static com.google.cloud.pso.gceusage.initialvminventory.InitialVMInventory.convertToBQRow;
import static junit.framework.TestCase.assertEquals;

import com.google.api.services.compute.model.Instance;
import com.google.api.services.compute.model.Scheduling;
import com.google.api.services.compute.model.Tags;
import com.google.cloud.pso.gceusage.initialvminventory.InitialInstanceInventoryRow.KV;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.io.IOException;
import java.math.BigInteger;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import org.apache.commons.io.IOUtils;
import org.junit.Before;
import org.junit.Test;

public class InitialVMInventoryTest {

  InitialInstanceInventoryRow initialInstanceInventoryRow;
  Instance instance;
  Gson gson = new GsonBuilder().setPrettyPrinting().create();;

  @Before
  public void setUp() {
    instance = new Instance();
    Scheduling scheduling = new Scheduling();
    scheduling.setPreemptible(false);
    scheduling.setAutomaticRestart(false);
    scheduling.setOnHostMaintenance("MIGRATE");

    String[] tagsArray = {"foo", "bar"};
    Tags tags = new Tags();
    tags.set("items", Arrays.asList(tagsArray));

    instance.setCreationTimestamp("2018-05-14T03:38:19.703-07:00");
    instance.setId(new BigInteger("123456789012345"));
    instance.setZone(
        "https://www.googleapis.com/compute/beta/projects/exampleprojectname/zones/us-east1-b");
    instance.setMachineType(
        "\"https://www.googleapis.com/compute/beta/projects/exampleprojectname/zones/us-east1-b/machineTypes/n1-standard-1");
    instance.setScheduling(scheduling);
    instance.setTags(tags);

    Map<String, String> labels = new HashMap<>();
    labels.put("key1", "value1");
    labels.put("key2", "value2");
    instance.setLabels(labels);

    initialInstanceInventoryRow = new InitialInstanceInventoryRow();
    initialInstanceInventoryRow.timestamp = "2018-05-14T03:38:19.703-07:00";
    initialInstanceInventoryRow.instanceId = "123456789012345";
    ArrayList resultLabels = new ArrayList<>();
    resultLabels.add(new KV("key1", "value1"));
    resultLabels.add(new KV("key2", "value2"));
    initialInstanceInventoryRow.labels = resultLabels;
    initialInstanceInventoryRow.machine_type = "n1-standard-1";
    initialInstanceInventoryRow.pd_ssd_size_gb = Float.valueOf((float) 0.0);
    initialInstanceInventoryRow.pd_standard_size_gb = Float.valueOf((float) 0.0);
    initialInstanceInventoryRow.local_ssd_size_gb = Float.valueOf((float) 0.0);
    initialInstanceInventoryRow.preemptible = false;
    initialInstanceInventoryRow.projectId = "exampleprojectname";
    initialInstanceInventoryRow.zone = "us-east1-b";
    initialInstanceInventoryRow.tags = Arrays.asList(tagsArray);
  }

  @Test
  public void convertToBQRowJsonTest() {
    assertEquals(gson.toJson(initialInstanceInventoryRow), gson.toJson(convertToBQRow(instance)));
  }

  @Test
  public void getInitialVMInventoryBQSchemaTest() throws IOException {
    String file =
        IOUtils.toString(
            this.getClass().getResourceAsStream("/schema/initial_inventory_schema.json"), "UTF-8");
    assertEquals(file, gson.toJson(InitialInstanceInventoryRow.getBQSchema()));
  }
}
