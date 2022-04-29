/*
 * Copyright 2022 Google LLC All Rights Reserved
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

package com.google.cloud.imf.util

import org.mockserver.integration.ClientAndServer
import org.mockserver.integration.ClientAndServer.startClientAndServer
import org.mockserver.socket.PortFactory
import org.mockserver.stop.Stop.stopQuietly
import org.scalatest.{BeforeAndAfterAll, BeforeAndAfterEach}
import org.scalatest.flatspec.AnyFlatSpec

abstract class MockedServerSpec extends AnyFlatSpec with BeforeAndAfterAll with BeforeAndAfterEach {

  val localHost = "127.0.0.1"
  val localPort = PortFactory.findFreePort()
  val mockServer: ClientAndServer = startClientAndServer(localPort)

  override protected def beforeEach(): Unit = mockServer.reset()

  override protected def afterAll(): Unit = stopQuietly(mockServer)

}



