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

import com.google.cloud.bqhiveloader.PartitionFilters.{PartitionFilter,Equals,GreaterThan,GreaterThanOrEq,LessThan,LessThanOrEq}
import org.scalatest.FlatSpec

class PartitionsFiltersSpec extends FlatSpec {
  "PartitionFilters" should "parse filter expressions" in {
    val expr = """region=US and date=2019-04-11"""
    val got = PartitionFilters.parse(expr)
    val expected = PartitionFilter(
      Seq(
        Equals("region", "US"),
        Equals("date", "2019-04-11"))
    )
    assert(got.contains(expected))
  }

  it should "parse range expressions" in {
    val expr = """date>2019-04-11 and date<2019-04-15"""
    val got = PartitionFilters.parse(expr)
    val expected = PartitionFilter(
      Seq(
        GreaterThan("date", "2019-04-11"),
        LessThan("date", "2019-04-15")
      )
    )
    assert(got.contains(expected))
  }

  it should "reject" in {
    assert(Equals("date", "2019-04-11").reject("date", "2019-04-10"))
    assert(Equals("date", "2019-04-11").accept("date", "2019-04-11"))
    assert(GreaterThan("date", "2019-04-11").reject("date", "2019-04-11"))
    assert(GreaterThan("date", "2019-04-11").reject("date", "2019-04-10"))
    assert(LessThan("date", "2019-04-15").reject("date", "2019-04-15"))
    assert(LessThan("date", "2019-04-15").reject("date", "2019-04-16"))
    assert("2019-04-15" <= "2019-04-16")
    assert(LessThanOrEq("date", "2019-04-15").reject("date", "2019-04-16"))
    assert(LessThanOrEq("date", "2019-04-15").accept("date", "2019-04-15"))
    assert(GreaterThanOrEq("date", "2019-04-11").reject("date", "2019-04-10"))
    assert(GreaterThanOrEq("date", "2019-04-11").accept("date", "2019-04-11"))
    assert(LessThanOrEq("id", "15").reject("id", "16"))
    assert(LessThanOrEq("id", "15").accept("id", "15"))
    assert(GreaterThanOrEq("id", "11").reject("id", "10"))
    assert(GreaterThanOrEq("id", "11").accept("id", "11"))
    assert(LessThanOrEq("id", "a").reject("id", "b"))
    assert(LessThanOrEq("id", "a").accept("id", "a"))
    assert(GreaterThanOrEq("id", "b").reject("id", "a"))
    assert(GreaterThanOrEq("id", "b").accept("id", "b"))
  }

}
