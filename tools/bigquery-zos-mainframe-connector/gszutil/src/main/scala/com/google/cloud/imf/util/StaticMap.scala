package com.google.cloud.imf.util

import com.google.common.collect.ImmutableSortedMap

object StaticMap extends Ordering[String] {
  def compare(x: String, y: String): Int = if (x == y) 0 else 1
  def builder: ImmutableSortedMap.Builder[String,Any] = new ImmutableSortedMap.Builder(this)
}
