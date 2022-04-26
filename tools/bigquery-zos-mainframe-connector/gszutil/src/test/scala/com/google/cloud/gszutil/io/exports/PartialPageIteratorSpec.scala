package com.google.cloud.gszutil.io.exports

import org.scalatest.flatspec.AnyFlatSpec

class PartialPageIteratorSpec extends AnyFlatSpec {
  def dummyPageFetcher(offset: Long, pageSize: Long): Page[Unit] = Page(None, pageSize)

  def boundPageFetcher(offset: Long, pageSize: Long): Page[(Long, Long)] = Page((offset, pageSize), pageSize)

  it should "Produce exception on wrong bounds setup" in {
    assertThrows[IllegalArgumentException] {
      new PartialPageIterator[Unit](5, 4, 2, dummyPageFetcher)
    }
    assertThrows[IllegalArgumentException] {
      new PartialPageIterator[Unit](2, 4, 0, dummyPageFetcher)
    }
    assertThrows[IllegalArgumentException] {
      new PartialPageIterator[Unit](-2, 4, 2, dummyPageFetcher)
    }
    assertThrows[IllegalArgumentException] {
      new PartialPageIterator[Unit](-4, -2, 2, dummyPageFetcher)
    }

    val iterator = new PartialPageIterator[Unit](2, 6, 2, dummyPageFetcher)
    iterator.next()
    iterator.next()
    assertThrows[NoSuchElementException] {
      iterator.next()
    }
  }

  it should "return correct page bounds on next() call" in {
    val iterator = new PartialPageIterator[(Long, Long)](50, 156, 50, boundPageFetcher)
    assert(iterator.hasNext())
    assertResult((50, 50))(iterator.next())
    assert(iterator.hasNext())
    assertResult((100, 50))(iterator.next())
    assert(iterator.hasNext())
    assertResult((150, 6))(iterator.next())
    assert(!iterator.hasNext())
  }

  it should "return correct page bounds on next() call with only one page" in {
    val iterator = new PartialPageIterator[(Long, Long)](0, 78, 100, boundPageFetcher)
    assert(iterator.hasNext())
    assertResult((0, 78))(iterator.next())
    assert(!iterator.hasNext())
  }

  it should "not crash at construction of an empty iterator" in {
    val iterator = new PartialPageIterator[Unit](0, 0, 1, dummyPageFetcher)
    assert(!iterator.hasNext())
  }
}
