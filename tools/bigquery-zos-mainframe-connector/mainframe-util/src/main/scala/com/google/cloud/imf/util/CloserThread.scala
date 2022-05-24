package com.google.cloud.imf.util

class CloserThread(c: AutoCloseable*) extends Thread {
  override def run(): Unit = c.foreach(_.close())
}
