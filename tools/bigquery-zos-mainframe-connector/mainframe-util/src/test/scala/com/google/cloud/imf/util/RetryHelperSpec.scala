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

import com.google.cloud.imf.util.RetryHelper._
import org.scalatest.flatspec.AnyFlatSpec

class RetryHelperSpec extends AnyFlatSpec {

  case class TestResponse(name: String = "response", error: String = "")

  var calls = 0

  def errorFunc(): Unit = {
    calls += 1
    println("error function called")
    if (calls <= 4)
      throw new IllegalStateException()
  }

  def responseFunc(): TestResponse = {
    calls += 1
    println("response function called")
    if (calls <= 4) TestResponse(error = "has error")
    else TestResponse()
  }

  "retryableOnError" should "return left after 4 attempts" in {
    calls = 0
    val res = retryableOnError(errorFunc())
    assert(calls == 4)
    assert(res.isLeft)
  }

  "retryableOnError" should "return right after 5 attempts" in {
    calls = 0
    val res = retryableOnError(errorFunc(), attempts = 5)
    assert(calls == 5)
    assert(res.isRight)
  }

  "retryableOnResponse" should "return error status after 4 attempts" in {
    calls = 0
    val canRetry = (x: TestResponse) => x.error.nonEmpty
    val res = retryableOnResponse(responseFunc(), "Should fail!", attempts = 3, sleep = 20, canRetry)

    assert(calls == 4)
    assert(res.name == "response")
    assert(res.error == "has error")
  }

  "retryableOnResponse" should "return success status after 5 attempts" in {
    calls = 0
    val canRetry = (x: TestResponse) => x.error.nonEmpty
    val res = retryableOnResponse(responseFunc(), "Must pass!", attempts = 20, sleep = 20, canRetry)

    assert(calls == 5)
    assert(res.name == "response")
    assert(res.error == "")
  }
}
