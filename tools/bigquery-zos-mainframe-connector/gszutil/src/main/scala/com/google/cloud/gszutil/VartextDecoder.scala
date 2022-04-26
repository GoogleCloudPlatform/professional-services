package com.google.cloud.gszutil

import org.apache.hadoop.hive.ql.exec.vector.ColumnVector

trait VartextDecoder extends Decoder {
  def transcoder: Transcoder


  /** Read a field into a mutable output builder
    *
    * @param s String
    * @param row ColumnVector
    * @param i row index
    */
  def get(s: String, row: ColumnVector, i: Int): Unit
}
