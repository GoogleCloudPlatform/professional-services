package com.google.cloud.bqsh

object ReturnCodes {
  // https://docs.teradata.com/reader/jmAxXLdiDu6NiyjT6hhk7g/geGjJyn6ceNXGJyY2ye2UQ
  val NotActive: Int = 2580
  val IndexAlreadyExists: Int = 3534
  val TableAlreadyExists: Int = 3803
  val ViewAlreadyExists: Int = 3804
  val MacroAlreadyExists: Int = 3805
  val DoesNotExist: Int = 3807
}
