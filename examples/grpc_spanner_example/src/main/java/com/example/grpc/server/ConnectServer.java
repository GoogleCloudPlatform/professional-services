/**
 * Copyright 2022 Google LLC
 *
 * <p>Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of the License at
 *
 * <p>http://www.apache.org/licenses/LICENSE-2.0
 *
 * <p>Unless required by applicable law or agreed to in writing, software distributed under the
 * License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.example.grpc.server;

import com.example.grpc.service.ConnectServiceImpl;
import io.grpc.Server;
import io.grpc.ServerBuilder;

/** Initializes Server. */
public class ConnectServer {

  public static void main(String[] args) throws Exception {
    Server server = ServerBuilder.forPort(8080).addService(new ConnectServiceImpl()).build();
    server.start();
    System.out.println("Server started");
    server.awaitTermination();
  }
}
