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
import com.google.cloud.spanner.v1.SpannerClient;
import com.google.protobuf.ListValue;
import com.google.spanner.v1.ExecuteSqlRequest;
import com.google.spanner.v1.ResultSet;
import com.google.spanner.v1.Session;
import io.grpc.stub.StreamObserver;
import java.io.IOException;

/** Implements rpc services call define in {@code connect_service_proto}. */
public class ConnectServiceImpl extends ConnectServiceImplBase {
  @Override
  public void getUser(GetUserRequest request, StreamObserver<GetUserResponse> responseObserver) {

    System.out.println(request);
    String name = "NoName";

    try (SpannerClient spannerClient = SpannerClient.create()) {
      Session session = SpannerUtil.createSession(spannerClient);

      // Call to Spanner
      ExecuteSqlRequest executeSqlRequest =
          ExecuteSqlRequest.newBuilder()
              .setSql("SELECT user_id, name FROM Users")
              .setSession(session.getName())
              .build();

      ResultSet resultSet = spannerClient.executeSql(executeSqlRequest);
      ListValue value = resultSet.getRows(0);
      name = value.getValues(1).getStringValue();
      System.out.println(name);

    } catch (IOException e) {
      e.printStackTrace();
    }
    GetUserResponse response =
        ConnectServiceOuterClass.GetUserResponse.newBuilder().setName(name).build();

    responseObserver.onNext(response);
    responseObserver.onCompleted();
  }
}
