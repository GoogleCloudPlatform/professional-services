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
import java.util.Collections
import com.google.api.client.auth.openidconnect.IdToken
import com.google.api.client.json.jackson2.JacksonFactory
/**
 *Verifies the token issuer
 */

object EnhancedIdToken {
  def apply(tokenEnc: String): EnhancedIdToken =
    new EnhancedIdToken(IdToken.parse(JacksonFactory.getDefaultInstance, tokenEnc))
}

class EnhancedIdToken(val idToken: IdToken){
  private val m = idToken.getPayload
    .get("google").asInstanceOf[java.util.Map[String,Any]]
    .get("compute_engine").asInstanceOf[java.util.Map[String,Any]]

  // Set different parameters which will identify the Dataproc instance
  def projectId: String = m.get("project_id").asInstanceOf[String]
  def projectNumber: Long = m.get("project_number").asInstanceOf[Long]
  def zone: String = m.get("zone").asInstanceOf[String]
  def instanceId: String = m.get("instance_id").asInstanceOf[String]
  def instanceName: String = m.get("instance_name").asInstanceOf[String]
  def instanceCreationTimestamp: Long = m.get("instance_creation_timestamp").asInstanceOf[java
  .math.BigDecimal].longValueExact()

  def verify(audience: String): Boolean = {
    // Verify the token
    val aud = idToken.verifyAudience(Collections.singleton(audience))
    val iss = idToken.verifyIssuer("https://accounts.google.com")
    val time = idToken.verifyTime(System.currentTimeMillis, 60)
    val exp = idToken.verifyExpirationTime(System.currentTimeMillis, 60)
    aud && iss && time && exp
  }

  lazy val age: Long = (System.currentTimeMillis/1000) - instanceCreationTimestamp
}
