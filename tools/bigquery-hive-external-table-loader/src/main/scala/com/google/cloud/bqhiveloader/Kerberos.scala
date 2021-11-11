/*
 * Copyright 2019 Google LLC
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

package com.google.cloud.bqhiveloader

import com.google.common.collect.ImmutableMap
import javax.security.auth.login.{AppConfigurationEntry, Configuration}

object Kerberos {
  private def createEntry(principal: String, keyTab: String): AppConfigurationEntry =
    new AppConfigurationEntry(
      "com.sun.security.auth.module.Krb5LoginModule",
      AppConfigurationEntry.LoginModuleControlFlag.REQUIRED,
      ImmutableMap.builder()
        .put("principal", principal)
        .put("keyTab", keyTab)
        .put("useTicketCache", "true")
        .put("isInitiator", "true")
        .put("doNotPrompt", "true")
        .put("useKeyTab", "true")
        .put("debug", "false")
        .put("storeKey", "true")
        .put("refreshKrb5Config", "true")
        .build()
    )

  class StaticConfiguration(private val entries: Array[AppConfigurationEntry]) extends Configuration {
    override def getAppConfigurationEntry(name: String): Array[AppConfigurationEntry] = entries
  }

  private def createConfig(principal: String, keyTab: String): Configuration =
    new StaticConfiguration(Array(createEntry(principal, keyTab)))

  def configureJaas(keyTab: String, principal: String): Unit =
    Configuration.setConfiguration(createConfig(principal, keyTab))
}
