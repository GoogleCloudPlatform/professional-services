package com.google.cloud.load

import com.google.cloud.gszutil.CopyBook

case class JobMetadata(testId: String,
                       index: Int,
                       name: String,
                       sql: String,
                       cb: CopyBook) {
  def jobId: String = s"$testId-$name"
}
