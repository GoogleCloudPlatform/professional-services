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
package com.example.grpc.service;

import com.example.grpc.ConnectServiceGrpc.ConnectServiceImplBase;
import com.example.grpc.ConnectServiceOuterClass;
import com.example.grpc.ConnectServiceOuterClass.GetUserRequest;
import com.example.grpc.ConnectServiceOuterClass.GetUserResponse;
import io.grpc.stub.StreamObserver;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;

/** Implements rpc services call define in {@code connect_service_proto}. */
public class ConnectServiceImpl extends ConnectServiceImplBase {

  private static final Logger logger = LoggerFactory.getLogger(ConnectServiceImpl.class);

  @Override
  public void getUser(GetUserRequest request, StreamObserver<GetUserResponse> responseObserver) {

    System.out.println(request);
    String name = "NoName";
    JedisPool jedisPool = RedisUtil.init();
    Jedis resource = jedisPool.getResource();

    // Reading the from redis.
    name =
        Optional.ofNullable(resource.get(String.valueOf(request.getUserId())))
            .orElse("resourceNotFound");
    logger.info("From redis memorystore: {}", name);

    GetUserResponse response =
        ConnectServiceOuterClass.GetUserResponse.newBuilder().setName(name).build();
    responseObserver.onNext(response);
    responseObserver.onCompleted();
  }
}
