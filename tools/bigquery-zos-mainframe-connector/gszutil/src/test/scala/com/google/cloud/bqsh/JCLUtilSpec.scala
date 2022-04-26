package com.google.cloud.bqsh

import org.scalatest.flatspec.AnyFlatSpec

class JCLUtilSpec extends AnyFlatSpec {
  "JCLUtil" should "match regex" in {
    assert("TDUS123".matches("^TD.*$"))
  }
}
