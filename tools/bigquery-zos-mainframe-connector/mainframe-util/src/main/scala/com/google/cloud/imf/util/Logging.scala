package com.google.cloud.imf.util

import org.apache.logging.log4j.{LogManager, Logger}

trait Logging {
  @transient
  protected lazy val logger: Logger =
    LogManager.getLogger(this.getClass.getSimpleName.stripSuffix("$"))
}
