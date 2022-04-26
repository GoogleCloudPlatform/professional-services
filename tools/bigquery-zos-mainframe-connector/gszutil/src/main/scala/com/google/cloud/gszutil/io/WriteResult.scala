package com.google.cloud.gszutil.io

case class WriteResult(rowCount: Long,
                       errCount: Long,
                       partBytes: Long,
                       partFinished: Boolean,
                       partPath: String)
