package com.google.cloud.imf.util

import java.util.concurrent.TimeUnit

import org.mockserver.model.HttpRequest.request
import org.mockserver.model.HttpResponse.response
import org.mockserver.model.Parameter.param
import org.mockserver.verify.VerificationTimes.exactly
import org.mockserver.matchers.Times
import org.mockserver.model.HttpError.error

import scala.util.Try

class BigQueryITSpec extends MockedServerSpec {

  val bgHost = s"http://$localHost:$localPort"
  val bqService = Services.bigQuerySpec("projectA", "US", Services.bigqueryCredentials(), bgHost)

  //"GET https://www.googleapis.com/bigquery/v2/projects/{projectId}/datasets/{datasetId}/tables/{tableId}"
  val bqGetTableRequest = request()
    .withMethod("GET")
    .withPath("/bigquery/v2/projects/{projectId}/datasets/{datasetId}/tables/{tableId}")
    .withPathParameters(
      param("projectId", "[A-Z0-9\\-]+"),
      param("datasetId", "[A-Z0-9\\-]+"),
      param("tableId", "[A-Z0-9\\-]+"),
    )

  "Simulate delay on server side" should "perform retry BQ API calls when all calls failed"  in {
    //delay is longer then read timeout
    mockServer
      .when(bqGetTableRequest, Times.exactly(5))
      .respond(
        response()
          .withBody("heavy computation operation")
          .withDelay(TimeUnit.SECONDS, 31000)
      )

    val resp = Try(bqService.getTable("datasetA", "tableA")).toEither

    mockServer.verify(bqGetTableRequest, exactly(5))
    assert(resp.isLeft)
  }

  "Simulate delay on server side" should "perform retry BQ API calls when last call successful"  in {
    //first 4 call delay is longer then read timeout
    mockServer
      .when(bqGetTableRequest, Times.exactly(4))
      .respond(
        response()
          .withBody("heavy computation operation")
          .withDelay(TimeUnit.SECONDS, 31)
      )

    //last call delay is lees then read timeout
    mockServer
      .when(bqGetTableRequest, Times.exactly(1))
      .respond(
        response()
          .withStatusCode(404)
          .withDelay(TimeUnit.SECONDS, 29)
      )

    val resp = Try(bqService.getTable("datasetA", "tableA")).toEither

    //Expected: 4 first calls fails due to timeout, last success, table not found
    mockServer.verify(bqGetTableRequest, exactly(5))
    assert(resp.isRight)
  }

  "Simulate connection error" should "perform retry API calls"  in {
    //this test controlled by retry settings in Apache http client
    mockServer
      .when(bqGetTableRequest)
      .error(
        error()
          .withDropConnection(true)
          .withResponseBytes(Array.empty[Byte])
      )

    val resp = Try(bqService.getTable("datasetA", "tableA")).toEither

    mockServer.verify(bqGetTableRequest, exactly(4))
    assert(resp.isLeft)
  }
}
