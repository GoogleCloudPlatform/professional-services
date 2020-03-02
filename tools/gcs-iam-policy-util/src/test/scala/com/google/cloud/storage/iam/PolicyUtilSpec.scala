/*
 * Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.google.cloud.storage.iam

import java.nio.charset.StandardCharsets

import com.google.api.client.googleapis.testing.auth.oauth2.MockGoogleCredential
import com.google.api.client.json.jackson2.JacksonFactory
import com.google.api.client.testing.http.MockHttpTransport
import com.google.api.services.storage.Storage
import com.google.cloud.storage.iam.Model.{Identity, User}
import com.google.cloud.storage.iam.Util.EnhancedStorage
import com.google.common.io.Resources
import org.scalatest.FlatSpec

class PolicyUtilSpec extends FlatSpec {
  def lines(r: String): Iterator[String] = {
    import scala.collection.JavaConverters.asScalaIteratorConverter
    Resources.readLines(Resources.getResource(r), StandardCharsets.UTF_8).iterator().asScala
  }

  "BPM" should "update bucket IAM policies" in {
    val config = new PolicyUtilConfig {
      override def zones = PolicyUtilConfig.readZones(lines("zones.conf")).toMap
      override def idSets = PolicyUtilConfig.readIdSets(lines("id_sets.conf"), parser).toMap
      override def policies = PolicyUtilConfig.readPolicies(lines("policies.conf")).toMap
      override def roleSets = PolicyUtilConfig.readRoleSets(lines("role_sets.conf")).toMap
      override def adminId: Set[Identity] = Set(User("admin@example.com"))
    }

    Util.clearCache(config.policyCacheUri, null)
    val mockStorage = new Storage.Builder(new MockHttpTransport, JacksonFactory.getDefaultInstance,
      new MockGoogleCredential.Builder().build).setApplicationName("gcs-iam-conditions").build()

    val storage = new EnhancedStorage(mockStorage, Util.loadCache(config.policyCacheUri, null))

    PolicyUtil.applyPolicies(config, storage, 0)
    val hitCount = storage.getHitCount
    val missCount = storage.getMissCount
    assert(hitCount == 0)
    assert(missCount > 0)

    // Save the cache
    Util.writeCache(config.policyCacheUri, storage.storage, storage.cache)

    // Run again, everything should be cached
    PolicyUtil.applyPolicies(config, storage, 0)
    assert(storage.getHitCount == missCount)
    assert(storage.getMissCount == missCount)

    // Wait for ttl to expire so that cache will not be used
    Thread.sleep(100)
    PolicyUtil.applyPolicies(config, storage, 0, ttl = -1)
    assert(storage.getHitCount == missCount)
    assert(storage.getMissCount == missCount * 2)
  }
}
