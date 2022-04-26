package com.google.cloud.bqsh

case class SdsfUtilConfig(jobPrefix: String = "*",
                          owner: String = "*",
                          bucket: String = "",
                          objPrefix: String = "SDSF")
