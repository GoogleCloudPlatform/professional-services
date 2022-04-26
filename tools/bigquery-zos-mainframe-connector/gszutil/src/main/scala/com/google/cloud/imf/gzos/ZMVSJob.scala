package com.google.cloud.imf.gzos

trait ZMVSJob {
  def getStatus: String
  def getOutput: Seq[String]
}
