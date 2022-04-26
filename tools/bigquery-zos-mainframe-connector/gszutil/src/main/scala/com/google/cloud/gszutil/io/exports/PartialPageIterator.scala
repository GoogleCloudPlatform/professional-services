package com.google.cloud.gszutil.io.exports

import scala.collection.AbstractIterator

case class Page[T](data: T, size: Long)

trait PageFetcher[T] {
  def fetch(startIndex: Long, pageSize: Long): Page[T]
}

/**
  * PartialPageIterator is used when you need to paginate over some window in array/stream of elements.
  * For example for Set(1,2,3,4,5,6,7,8,9,10) you need to iterate starting from 5 until 10 with page size 2.
  *
  * @param startIndex  left bound/offset of window
  * @param endIndex    right bound of window
  * @param pageSize    size of page/bulk, basically this is iteration step
  * @param pageFetcher function that provide page by left offset and size
  * @tparam T - page type
  */
class PartialPageIterator[T](val startIndex: Long, val endIndex: Long, val pageSize: Long, pageFetcher: PageFetcher[T]) extends AbstractIterator[T] {
  if (startIndex < 0 || endIndex < 0 || pageSize < 1 || startIndex > endIndex)
    throw new IllegalArgumentException(s"Iterator bounds check failed, check bounds values [startIndex=$startIndex, endIndex=$endIndex, pageSize=$pageSize]")
  private var currentIndex = startIndex

  override def hasNext(): Boolean = {
    currentIndex < endIndex
  }

  override def next(): T = {
    if (!hasNext()) {
      Iterator.empty.next()
    }
    val result = pageFetcher.fetch(currentIndex, Math.min(endIndex - currentIndex, pageSize))
    currentIndex = currentIndex + result.size
    result.data
  }
}

