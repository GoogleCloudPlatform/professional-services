package com.google.cloud.imf.gzos

object MVSStorage {
  sealed trait DSN {
    def fqdsn: String
    override def toString: String = fqdsn
  }

  case class MVSDataset(dsn: String) extends DSN {
    override val fqdsn: String = s"//'$dsn'"
  }

  case class MVSPDSMember(pdsDsn: String, member: String) extends DSN {
    override val fqdsn: String = s"//'$pdsDsn($member)'"
  }

  def parseDSN(dsn: String): DSN = {
    val s = dsn.stripPrefix("//").stripPrefix("'").stripSuffix("'")
    val i = s.indexOf("(")
    val j = s.indexOf(")")
    if (i > 0 && j > i){
     MVSPDSMember(s.substring(0,i),s.substring(i+1,j))
    } else MVSDataset(s)
  }
}
