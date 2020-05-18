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
import java.nio.file.{Files, Paths}

object AuthServiceConfig {
  /**
   *Defines environment variables for web server and validates them
   */
  def fromEnv: AuthServiceConfig =
    AuthServiceConfig(
      // set env variables
      interface = sys.env.getOrElse("BIND_ADDR", "localhost"),
      port = sys.env.getOrElse("BIND_PORT", "8080").toInt,
      dir = sys.env.getOrElse("APP_DIR", "."),
      projectId = sys.env("PROJECT"),
      zone = sys.env("ZONE"),
      audience = sys.env("AUDIENCE"),
      // set maximum time till which the token is available for a cluster
      maxAgeSeconds = sys.env.getOrElse("MAX_AGE", "300").toInt
    ).validate()
}

case class AuthServiceConfig(interface: String = "",
                             port: Int = -1,
                             dir: String = "",
                             projectId: String = "",
                             zone: String = "",
                             maxAgeSeconds: Int = -1,
                             audience: String = "") {
  def validate(): AuthServiceConfig = {
    require(Files.isDirectory(Paths.get(dir)), s"APP_DIR must be a directory")
    require(Files.isReadable(Paths.get(dir)), s"APP_DIR must be readable")
    require(Range.inclusive(0,65535).contains(port), "BIND_PORT must be in range [0,65535]")
    require(maxAgeSeconds > 0, "MAX_AGE must be non-negative")
    this
  }
}
