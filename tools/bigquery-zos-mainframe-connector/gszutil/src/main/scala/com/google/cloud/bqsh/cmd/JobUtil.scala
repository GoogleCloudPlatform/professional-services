package com.google.cloud.bqsh.cmd


import com.google.cloud.bqsh.{ArgParser, Command, JobUtilConfig, JobUtilOptionParser}
import com.google.cloud.imf.gzos.MVS
import com.google.cloud.imf.gzos.MVSStorage.MVSPDSMember
import com.google.cloud.imf.util.Logging


object JobUtil extends Command[JobUtilConfig] with Logging {
  override val name: String = "jclutil"
  override val parser: ArgParser[JobUtilConfig] = JobUtilOptionParser

  override def run(config: JobUtilConfig, zos: MVS, env: Map[String,String]): Result = {
    if (config.filter.nonEmpty)
      Console.out.println(s"Filter regex = '${config.filter}'")

    val members = zos.listPDS(config.srcDSN)

    while (members.hasNext){
      val member = members.next()
      if (config.filter.isEmpty || member.name.matches(config.filter)){
        Console.out.println(s"Processing '${member.name}'")
        val lines = zos.readDSNLines(MVSPDSMember(config.src,member.name))
        val jcl = readJCL(lines).toArray.toSeq
        val result = zos.submitJCL(jcl)
        if (result.isDefined) {
          Console.out.println(result.get.getStatus)
          Console.out.println(result.get.getOutput)
        }
      } else {
        Console.out.println(s"Ignored '${member.name}'")
      }
    }
    Result.Success
  }

  def readJCL(lines: Iterator[String]): Iterator[String] = {
    val it = lines.buffered
    val lrecl = it.head.length
    val hasMarginDigits = it.head.takeRight(8).forall(_.isDigit)
    if (lrecl == 80 && hasMarginDigits) {
      // Trailing 8 characters separately
      it.map(_.take(72))
    } else it
  }
}
