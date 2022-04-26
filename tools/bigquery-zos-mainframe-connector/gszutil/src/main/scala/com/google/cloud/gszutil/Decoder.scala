package com.google.cloud.gszutil

import java.nio.ByteBuffer

import com.google.cloud.imf.gzos.pb.GRecvProto.Record.Field
import org.apache.hadoop.hive.ql.exec.vector.ColumnVector
import org.apache.orc.TypeDescription

trait Decoder {
  val size: Int
  def filler: Boolean

  /** Read a field into a mutable output builder
    *
    * @param buf ByteBuffer
    * @param col ColumnVector
    * @param i row index
    */
  def get(buf: ByteBuffer, col: ColumnVector, i: Int): Unit

  def columnVector(maxSize: Int): ColumnVector

  def typeDescription: TypeDescription

  /** Proto Representation */
  def toFieldBuilder: Field.Builder
}
