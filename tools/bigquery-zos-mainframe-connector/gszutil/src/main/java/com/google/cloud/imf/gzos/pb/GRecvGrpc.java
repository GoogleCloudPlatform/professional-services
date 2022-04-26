package com.google.cloud.imf.gzos.pb;

import static io.grpc.MethodDescriptor.generateFullMethodName;
import static io.grpc.stub.ClientCalls.asyncBidiStreamingCall;
import static io.grpc.stub.ClientCalls.asyncClientStreamingCall;
import static io.grpc.stub.ClientCalls.asyncServerStreamingCall;
import static io.grpc.stub.ClientCalls.asyncUnaryCall;
import static io.grpc.stub.ClientCalls.blockingServerStreamingCall;
import static io.grpc.stub.ClientCalls.blockingUnaryCall;
import static io.grpc.stub.ClientCalls.futureUnaryCall;
import static io.grpc.stub.ServerCalls.asyncBidiStreamingCall;
import static io.grpc.stub.ServerCalls.asyncClientStreamingCall;
import static io.grpc.stub.ServerCalls.asyncServerStreamingCall;
import static io.grpc.stub.ServerCalls.asyncUnaryCall;
import static io.grpc.stub.ServerCalls.asyncUnimplementedStreamingCall;
import static io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall;

/**
 */
@javax.annotation.Generated(
    value = "by gRPC proto compiler (version 1.23.0)",
    comments = "Source: grecv.proto")
public final class GRecvGrpc {

  private GRecvGrpc() {}

  public static final String SERVICE_NAME = "com.google.cloud.imf.gzos.GRecv";

  // Static method descriptors that strictly reflect the proto.
  private static volatile io.grpc.MethodDescriptor<com.google.cloud.imf.gzos.pb.GRecvProto.GRecvRequest,
      com.google.cloud.imf.gzos.pb.GRecvProto.GRecvResponse> getWriteMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "Write",
      requestType = com.google.cloud.imf.gzos.pb.GRecvProto.GRecvRequest.class,
      responseType = com.google.cloud.imf.gzos.pb.GRecvProto.GRecvResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<com.google.cloud.imf.gzos.pb.GRecvProto.GRecvRequest,
      com.google.cloud.imf.gzos.pb.GRecvProto.GRecvResponse> getWriteMethod() {
    io.grpc.MethodDescriptor<com.google.cloud.imf.gzos.pb.GRecvProto.GRecvRequest, com.google.cloud.imf.gzos.pb.GRecvProto.GRecvResponse> getWriteMethod;
    if ((getWriteMethod = GRecvGrpc.getWriteMethod) == null) {
      synchronized (GRecvGrpc.class) {
        if ((getWriteMethod = GRecvGrpc.getWriteMethod) == null) {
          GRecvGrpc.getWriteMethod = getWriteMethod =
              io.grpc.MethodDescriptor.<com.google.cloud.imf.gzos.pb.GRecvProto.GRecvRequest, com.google.cloud.imf.gzos.pb.GRecvProto.GRecvResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "Write"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.google.cloud.imf.gzos.pb.GRecvProto.GRecvRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.google.cloud.imf.gzos.pb.GRecvProto.GRecvResponse.getDefaultInstance()))
              .setSchemaDescriptor(new GRecvMethodDescriptorSupplier("Write"))
              .build();
        }
      }
    }
    return getWriteMethod;
  }

  private static volatile io.grpc.MethodDescriptor<com.google.cloud.imf.gzos.pb.GRecvProto.GRecvExportRequest,
      com.google.cloud.imf.gzos.pb.GRecvProto.GRecvResponse> getExportMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "Export",
      requestType = com.google.cloud.imf.gzos.pb.GRecvProto.GRecvExportRequest.class,
      responseType = com.google.cloud.imf.gzos.pb.GRecvProto.GRecvResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<com.google.cloud.imf.gzos.pb.GRecvProto.GRecvExportRequest,
      com.google.cloud.imf.gzos.pb.GRecvProto.GRecvResponse> getExportMethod() {
    io.grpc.MethodDescriptor<com.google.cloud.imf.gzos.pb.GRecvProto.GRecvExportRequest, com.google.cloud.imf.gzos.pb.GRecvProto.GRecvResponse> getExportMethod;
    if ((getExportMethod = GRecvGrpc.getExportMethod) == null) {
      synchronized (GRecvGrpc.class) {
        if ((getExportMethod = GRecvGrpc.getExportMethod) == null) {
          GRecvGrpc.getExportMethod = getExportMethod =
              io.grpc.MethodDescriptor.<com.google.cloud.imf.gzos.pb.GRecvProto.GRecvExportRequest, com.google.cloud.imf.gzos.pb.GRecvProto.GRecvResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "Export"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.google.cloud.imf.gzos.pb.GRecvProto.GRecvExportRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.google.cloud.imf.gzos.pb.GRecvProto.GRecvResponse.getDefaultInstance()))
              .setSchemaDescriptor(new GRecvMethodDescriptorSupplier("Export"))
              .build();
        }
      }
    }
    return getExportMethod;
  }

  private static volatile io.grpc.MethodDescriptor<com.google.cloud.imf.gzos.pb.GRecvProto.HealthCheckRequest,
      com.google.cloud.imf.gzos.pb.GRecvProto.HealthCheckResponse> getCheckMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "Check",
      requestType = com.google.cloud.imf.gzos.pb.GRecvProto.HealthCheckRequest.class,
      responseType = com.google.cloud.imf.gzos.pb.GRecvProto.HealthCheckResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<com.google.cloud.imf.gzos.pb.GRecvProto.HealthCheckRequest,
      com.google.cloud.imf.gzos.pb.GRecvProto.HealthCheckResponse> getCheckMethod() {
    io.grpc.MethodDescriptor<com.google.cloud.imf.gzos.pb.GRecvProto.HealthCheckRequest, com.google.cloud.imf.gzos.pb.GRecvProto.HealthCheckResponse> getCheckMethod;
    if ((getCheckMethod = GRecvGrpc.getCheckMethod) == null) {
      synchronized (GRecvGrpc.class) {
        if ((getCheckMethod = GRecvGrpc.getCheckMethod) == null) {
          GRecvGrpc.getCheckMethod = getCheckMethod =
              io.grpc.MethodDescriptor.<com.google.cloud.imf.gzos.pb.GRecvProto.HealthCheckRequest, com.google.cloud.imf.gzos.pb.GRecvProto.HealthCheckResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "Check"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.google.cloud.imf.gzos.pb.GRecvProto.HealthCheckRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.google.cloud.imf.gzos.pb.GRecvProto.HealthCheckResponse.getDefaultInstance()))
              .setSchemaDescriptor(new GRecvMethodDescriptorSupplier("Check"))
              .build();
        }
      }
    }
    return getCheckMethod;
  }

  /**
   * Creates a new async stub that supports all call types for the service
   */
  public static GRecvStub newStub(io.grpc.Channel channel) {
    return new GRecvStub(channel);
  }

  /**
   * Creates a new blocking-style stub that supports unary and streaming output calls on the service
   */
  public static GRecvBlockingStub newBlockingStub(
      io.grpc.Channel channel) {
    return new GRecvBlockingStub(channel);
  }

  /**
   * Creates a new ListenableFuture-style stub that supports unary calls on the service
   */
  public static GRecvFutureStub newFutureStub(
      io.grpc.Channel channel) {
    return new GRecvFutureStub(channel);
  }

  /**
   */
  public static abstract class GRecvImplBase implements io.grpc.BindableService {

    /**
     */
    public void write(com.google.cloud.imf.gzos.pb.GRecvProto.GRecvRequest request,
        io.grpc.stub.StreamObserver<com.google.cloud.imf.gzos.pb.GRecvProto.GRecvResponse> responseObserver) {
      asyncUnimplementedUnaryCall(getWriteMethod(), responseObserver);
    }

    /**
     */
    public void export(com.google.cloud.imf.gzos.pb.GRecvProto.GRecvExportRequest request,
        io.grpc.stub.StreamObserver<com.google.cloud.imf.gzos.pb.GRecvProto.GRecvResponse> responseObserver) {
      asyncUnimplementedUnaryCall(getExportMethod(), responseObserver);
    }

    /**
     */
    public void check(com.google.cloud.imf.gzos.pb.GRecvProto.HealthCheckRequest request,
        io.grpc.stub.StreamObserver<com.google.cloud.imf.gzos.pb.GRecvProto.HealthCheckResponse> responseObserver) {
      asyncUnimplementedUnaryCall(getCheckMethod(), responseObserver);
    }

    @java.lang.Override public final io.grpc.ServerServiceDefinition bindService() {
      return io.grpc.ServerServiceDefinition.builder(getServiceDescriptor())
          .addMethod(
            getWriteMethod(),
            asyncUnaryCall(
              new MethodHandlers<
                com.google.cloud.imf.gzos.pb.GRecvProto.GRecvRequest,
                com.google.cloud.imf.gzos.pb.GRecvProto.GRecvResponse>(
                  this, METHODID_WRITE)))
          .addMethod(
            getExportMethod(),
            asyncUnaryCall(
              new MethodHandlers<
                com.google.cloud.imf.gzos.pb.GRecvProto.GRecvExportRequest,
                com.google.cloud.imf.gzos.pb.GRecvProto.GRecvResponse>(
                  this, METHODID_EXPORT)))
          .addMethod(
            getCheckMethod(),
            asyncUnaryCall(
              new MethodHandlers<
                com.google.cloud.imf.gzos.pb.GRecvProto.HealthCheckRequest,
                com.google.cloud.imf.gzos.pb.GRecvProto.HealthCheckResponse>(
                  this, METHODID_CHECK)))
          .build();
    }
  }

  /**
   */
  public static final class GRecvStub extends io.grpc.stub.AbstractStub<GRecvStub> {
    private GRecvStub(io.grpc.Channel channel) {
      super(channel);
    }

    private GRecvStub(io.grpc.Channel channel,
        io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected GRecvStub build(io.grpc.Channel channel,
        io.grpc.CallOptions callOptions) {
      return new GRecvStub(channel, callOptions);
    }

    /**
     */
    public void write(com.google.cloud.imf.gzos.pb.GRecvProto.GRecvRequest request,
        io.grpc.stub.StreamObserver<com.google.cloud.imf.gzos.pb.GRecvProto.GRecvResponse> responseObserver) {
      asyncUnaryCall(
          getChannel().newCall(getWriteMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void export(com.google.cloud.imf.gzos.pb.GRecvProto.GRecvExportRequest request,
        io.grpc.stub.StreamObserver<com.google.cloud.imf.gzos.pb.GRecvProto.GRecvResponse> responseObserver) {
      asyncUnaryCall(
          getChannel().newCall(getExportMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void check(com.google.cloud.imf.gzos.pb.GRecvProto.HealthCheckRequest request,
        io.grpc.stub.StreamObserver<com.google.cloud.imf.gzos.pb.GRecvProto.HealthCheckResponse> responseObserver) {
      asyncUnaryCall(
          getChannel().newCall(getCheckMethod(), getCallOptions()), request, responseObserver);
    }
  }

  /**
   */
  public static final class GRecvBlockingStub extends io.grpc.stub.AbstractStub<GRecvBlockingStub> {
    private GRecvBlockingStub(io.grpc.Channel channel) {
      super(channel);
    }

    private GRecvBlockingStub(io.grpc.Channel channel,
        io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected GRecvBlockingStub build(io.grpc.Channel channel,
        io.grpc.CallOptions callOptions) {
      return new GRecvBlockingStub(channel, callOptions);
    }

    /**
     */
    public com.google.cloud.imf.gzos.pb.GRecvProto.GRecvResponse write(com.google.cloud.imf.gzos.pb.GRecvProto.GRecvRequest request) {
      return blockingUnaryCall(
          getChannel(), getWriteMethod(), getCallOptions(), request);
    }

    /**
     */
    public com.google.cloud.imf.gzos.pb.GRecvProto.GRecvResponse export(com.google.cloud.imf.gzos.pb.GRecvProto.GRecvExportRequest request) {
      return blockingUnaryCall(
          getChannel(), getExportMethod(), getCallOptions(), request);
    }

    /**
     */
    public com.google.cloud.imf.gzos.pb.GRecvProto.HealthCheckResponse check(com.google.cloud.imf.gzos.pb.GRecvProto.HealthCheckRequest request) {
      return blockingUnaryCall(
          getChannel(), getCheckMethod(), getCallOptions(), request);
    }
  }

  /**
   */
  public static final class GRecvFutureStub extends io.grpc.stub.AbstractStub<GRecvFutureStub> {
    private GRecvFutureStub(io.grpc.Channel channel) {
      super(channel);
    }

    private GRecvFutureStub(io.grpc.Channel channel,
        io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected GRecvFutureStub build(io.grpc.Channel channel,
        io.grpc.CallOptions callOptions) {
      return new GRecvFutureStub(channel, callOptions);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<com.google.cloud.imf.gzos.pb.GRecvProto.GRecvResponse> write(
        com.google.cloud.imf.gzos.pb.GRecvProto.GRecvRequest request) {
      return futureUnaryCall(
          getChannel().newCall(getWriteMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<com.google.cloud.imf.gzos.pb.GRecvProto.GRecvResponse> export(
        com.google.cloud.imf.gzos.pb.GRecvProto.GRecvExportRequest request) {
      return futureUnaryCall(
          getChannel().newCall(getExportMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<com.google.cloud.imf.gzos.pb.GRecvProto.HealthCheckResponse> check(
        com.google.cloud.imf.gzos.pb.GRecvProto.HealthCheckRequest request) {
      return futureUnaryCall(
          getChannel().newCall(getCheckMethod(), getCallOptions()), request);
    }
  }

  private static final int METHODID_WRITE = 0;
  private static final int METHODID_EXPORT = 1;
  private static final int METHODID_CHECK = 2;

  private static final class MethodHandlers<Req, Resp> implements
      io.grpc.stub.ServerCalls.UnaryMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.ServerStreamingMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.ClientStreamingMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.BidiStreamingMethod<Req, Resp> {
    private final GRecvImplBase serviceImpl;
    private final int methodId;

    MethodHandlers(GRecvImplBase serviceImpl, int methodId) {
      this.serviceImpl = serviceImpl;
      this.methodId = methodId;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("unchecked")
    public void invoke(Req request, io.grpc.stub.StreamObserver<Resp> responseObserver) {
      switch (methodId) {
        case METHODID_WRITE:
          serviceImpl.write((com.google.cloud.imf.gzos.pb.GRecvProto.GRecvRequest) request,
              (io.grpc.stub.StreamObserver<com.google.cloud.imf.gzos.pb.GRecvProto.GRecvResponse>) responseObserver);
          break;
        case METHODID_EXPORT:
          serviceImpl.export((com.google.cloud.imf.gzos.pb.GRecvProto.GRecvExportRequest) request,
              (io.grpc.stub.StreamObserver<com.google.cloud.imf.gzos.pb.GRecvProto.GRecvResponse>) responseObserver);
          break;
        case METHODID_CHECK:
          serviceImpl.check((com.google.cloud.imf.gzos.pb.GRecvProto.HealthCheckRequest) request,
              (io.grpc.stub.StreamObserver<com.google.cloud.imf.gzos.pb.GRecvProto.HealthCheckResponse>) responseObserver);
          break;
        default:
          throw new AssertionError();
      }
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("unchecked")
    public io.grpc.stub.StreamObserver<Req> invoke(
        io.grpc.stub.StreamObserver<Resp> responseObserver) {
      switch (methodId) {
        default:
          throw new AssertionError();
      }
    }
  }

  private static abstract class GRecvBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoFileDescriptorSupplier, io.grpc.protobuf.ProtoServiceDescriptorSupplier {
    GRecvBaseDescriptorSupplier() {}

    @java.lang.Override
    public com.google.protobuf.Descriptors.FileDescriptor getFileDescriptor() {
      return com.google.cloud.imf.gzos.pb.GRecvProto.getDescriptor();
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.ServiceDescriptor getServiceDescriptor() {
      return getFileDescriptor().findServiceByName("GRecv");
    }
  }

  private static final class GRecvFileDescriptorSupplier
      extends GRecvBaseDescriptorSupplier {
    GRecvFileDescriptorSupplier() {}
  }

  private static final class GRecvMethodDescriptorSupplier
      extends GRecvBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoMethodDescriptorSupplier {
    private final String methodName;

    GRecvMethodDescriptorSupplier(String methodName) {
      this.methodName = methodName;
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.MethodDescriptor getMethodDescriptor() {
      return getServiceDescriptor().findMethodByName(methodName);
    }
  }

  private static volatile io.grpc.ServiceDescriptor serviceDescriptor;

  public static io.grpc.ServiceDescriptor getServiceDescriptor() {
    io.grpc.ServiceDescriptor result = serviceDescriptor;
    if (result == null) {
      synchronized (GRecvGrpc.class) {
        result = serviceDescriptor;
        if (result == null) {
          serviceDescriptor = result = io.grpc.ServiceDescriptor.newBuilder(SERVICE_NAME)
              .setSchemaDescriptor(new GRecvFileDescriptorSupplier())
              .addMethod(getWriteMethod())
              .addMethod(getExportMethod())
              .addMethod(getCheckMethod())
              .build();
        }
      }
    }
    return result;
  }
}
