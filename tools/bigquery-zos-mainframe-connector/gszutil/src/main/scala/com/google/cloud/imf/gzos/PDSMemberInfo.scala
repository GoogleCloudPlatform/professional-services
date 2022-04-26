package com.google.cloud.imf.gzos

trait PDSMemberInfo {
  def name: String
  def currentLines: Int
  def creationDate: java.util.Date
  def modificationDate: java.util.Date
  def userId: String
  def version: Int
}
