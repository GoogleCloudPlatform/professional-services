package com.google.cloud.imf.util

import com.google.api.gax.paging.Page

import scala.jdk.CollectionConverters.IterableHasAsScala

/** Iterator for paged Google Cloud API responses */
class PageIterator[T](private var page: Page[T]) extends Iterator[T] {
  private var values: Iterator[T] = page.getValues.asScala.iterator

  override def hasNext: Boolean = values.hasNext || page.hasNextPage

  override def next(): T = {
    if (!values.hasNext && page.hasNextPage) {
      page = page.getNextPage
      values = page.getValues.asScala.iterator
    }
    values.next()
  }
}
