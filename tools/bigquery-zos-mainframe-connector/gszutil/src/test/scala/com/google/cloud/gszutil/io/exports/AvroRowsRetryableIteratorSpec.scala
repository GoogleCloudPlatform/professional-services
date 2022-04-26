package com.google.cloud.gszutil.io.exports

import com.google.api.gax.rpc.{ServerStream, ServerStreamingCallable}
import com.google.cloud.bigquery.storage.v1.{ReadRowsRequest, ReadRowsResponse}
import org.mockito.{ArgumentMatchers, Mockito}
import org.scalatest.flatspec.AnyFlatSpec

import java.util

class AvroRowsRetryableIteratorSpec extends AnyFlatSpec {
  it should "simple iterator test" in {
    val request = ReadRowsRequest.newBuilder().setOffset(0).setReadStream("dummy_stream").build()
    val serverStream = Mockito.mock(classOf[ServerStream[ReadRowsResponse]])
    val response = ReadRowsResponse.newBuilder().build()
    Mockito.when(serverStream.iterator()).thenReturn(
      util.Arrays.asList(response).iterator()
    )

    val serverStreaming = Mockito.mock(classOf[ServerStreamingCallable[ReadRowsRequest, ReadRowsResponse]])
    Mockito.when(serverStreaming.call(request)).thenReturn(
      serverStream
    )

    val iterator = new AvroRowsRetryableIterator(serverStreaming, request)
    assert(iterator.hasNext)
    assert(iterator.next.eq(response))
    assert(!iterator.hasNext)
  }

  it should "retry for hasNext()" in {
    val request = ReadRowsRequest.newBuilder().setOffset(0).setReadStream("dummy_stream").build()
    val serverStream = Mockito.mock(classOf[ServerStream[ReadRowsResponse]])
    Mockito.when(serverStream.iterator()).thenReturn(
      new util.Iterator[ReadRowsResponse] {
        override def hasNext: Boolean = throw new IllegalStateException("dummy iterator crash")

        override def next(): ReadRowsResponse = ???
      }
    )

    val serverStreaming = Mockito.mock(classOf[ServerStreamingCallable[ReadRowsRequest, ReadRowsResponse]])
    Mockito.when(serverStreaming.call(ArgumentMatchers.any())).thenReturn(
      serverStream
    )

    val iterator = new AvroRowsRetryableIterator(serverStreaming, request, 1)
    iterator.consumed(1)
    assertThrows[IllegalStateException](iterator.hasNext)
    Mockito.verify(serverStream, Mockito.times(1)).cancel()

    val expectedArgWithOffset = request.toBuilder.setOffset(1).build()
    Mockito.verify(serverStreaming, Mockito.times(1)).call(expectedArgWithOffset)
  }

  it should "retry for next()" in {
    val request = ReadRowsRequest.newBuilder().setOffset(0).setReadStream("dummy_stream").build()
    val serverStream = Mockito.mock(classOf[ServerStream[ReadRowsResponse]])
    Mockito.when(serverStream.iterator()).thenReturn(
      new util.Iterator[ReadRowsResponse] {
        override def hasNext: Boolean = ???

        override def next(): ReadRowsResponse = throw new IllegalStateException("dummy iterator crash")
      }
    )

    val serverStreaming = Mockito.mock(classOf[ServerStreamingCallable[ReadRowsRequest, ReadRowsResponse]])
    Mockito.when(serverStreaming.call(ArgumentMatchers.any())).thenReturn(
      serverStream
    )

    val iterator = new AvroRowsRetryableIterator(serverStreaming, request, 1)
    iterator.consumed(1)
    assertThrows[IllegalStateException](iterator.next)
    Mockito.verify(serverStream, Mockito.times(1)).cancel()

    val expectedArgWithOffset = request.toBuilder.setOffset(1).build()
    Mockito.verify(serverStreaming, Mockito.times(1)).call(expectedArgWithOffset)
  }

  it should "fail on param validation" in {
    val serverStreaming = Mockito.mock(classOf[ServerStreamingCallable[ReadRowsRequest, ReadRowsResponse]])
    val request = ReadRowsRequest.newBuilder().setOffset(0).setReadStream("dummy_stream").build()

    assertThrows[IllegalArgumentException](new AvroRowsRetryableIterator(serverStreaming, request, -15))
    assertThrows[IllegalArgumentException](new AvroRowsRetryableIterator(serverStreaming, request, 0, 0, 5))
    assertThrows[IllegalArgumentException](new AvroRowsRetryableIterator(serverStreaming, request, 0, 5, 2))
  }

}
