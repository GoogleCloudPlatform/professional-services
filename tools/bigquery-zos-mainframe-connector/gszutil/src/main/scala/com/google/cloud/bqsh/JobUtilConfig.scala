package com.google.cloud.bqsh

import com.google.cloud.imf.gzos.MVSStorage.{DSN, MVSDataset}

case class JobUtilConfig(src: String = "",
                         filter: String = "^TD.*$") {
  def srcDSN: DSN = MVSDataset(src)
}
