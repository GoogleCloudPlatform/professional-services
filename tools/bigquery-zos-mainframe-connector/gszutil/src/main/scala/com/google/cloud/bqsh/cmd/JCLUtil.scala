package com.google.cloud.bqsh.cmd

import com.google.cloud.bqsh.{ArgParser, Command, JCLUtilConfig, JCLUtilOptionParser}
import com.google.cloud.imf.gzos.MVS
import com.google.cloud.imf.gzos.MVSStorage.{DSN, MVSPDSMember}
import com.google.cloud.imf.util.Logging


object JCLUtil extends Command[JCLUtilConfig] with Logging {
  override val name: String = "jclutil"
  override val parser: ArgParser[JCLUtilConfig] = JCLUtilOptionParser

  override def run(config: JCLUtilConfig, zos: MVS, env: Map[String,String]): Result = {
    val transform: (String) => String = replacePrefix(_, "BQ")
    val members = zos.listPDS(config.srcDSN)

    val exprs: Seq[(String,String)] =
      if (config.expressions.nonEmpty)
        config.exprs
      else Seq(
        "ARCHVEXT"   -> "IGNORED",
        "BTEQ"       -> "BQSQLEXT",
        "BTEQEXT"    -> "BQSQLEXT",
        "DBCARC"     -> "IGNORED",
        "DBCFDL"     -> "BQFLDEXT",
        "DBCMLD"     -> "BQMLDEXT",
        "DBCTPUMP"   -> "BQTPUEXT",
        "FLOADEXT"   -> "BQFLDEXT",
        "MLOADEXT"   -> "BQMLDEXT",
        "STATSEXT"   -> "IGNORED",
        "FEXPOEXT"   -> "IGNORED",
        "//TD"       -> "//BQ",
        "JOBCHK=TD"  -> "JOBCHK=BQ",
        "JOBNAME=TD" -> "JOBNAME=BQ",
        "INCLUDE MEMBER=(TDSP" -> "INCLUDE MEMBER=(BQSP"
      )

    if (config.filter.nonEmpty){
      Console.out.println(s"Filter regex = '${config.filter}'")
    }

    while (members.hasNext){
      val member = members.next()
      if (config.printSteps) {
        printSteps(MVSPDSMember(config.src,member.name), zos)
      } else if (config.filter.isEmpty || member.name.matches(config.filter)){
        Console.out.println(s"Processing '${member.name}'")
        val result = copy(MVSPDSMember(config.src,member.name),
                          MVSPDSMember(config.dest,transform(member.name)),
                          config.limit,
                          exprs,
                          zos)
        if (result.exitCode != 0) {
          Console.out.println(s"Non-zero exit code returned for ${member.name}")
          return result
        }
      } else {
        Console.out.println(s"Ignored '${member.name}'")
      }
    }
    Result.Success
  }

  def replacePrefix(name: String, sub: String): String =
    sub + name.substring(sub.length)

  def readWithReplacements(lines: Iterator[String],
                           exprs: Seq[(String,String)],
                           limit: Long): Iterator[String] = {
    val it = lines.buffered
    val lrecl = it.head.length
    val hasMarginDigits = it.head.takeRight(8).forall(_.isDigit)
    if (lrecl == 80 && hasMarginDigits) {
      // Trailing 8 characters separately
      val it1 = it.map{line => (line.take(72),line.drop(72))}

      // lines with all replacements applied
      exprs.foldLeft(it1){(a,b) =>
        a.map{x => (x._1.replaceAllLiterally(b._1,b._2), x._2)}
      }.map{x =>
        x._1.take(72) + x._2
      }
    } else {
      // Entire record is eligible for replacement
      exprs.foldLeft[Iterator[String]](it){(a,b) =>
        a.map{x => x.replaceAllLiterally(b._1,b._2)}
      }
    }
  }

  case class Step(name: String, proc: String, mbr: String){
    override def toString: String = s"$name $proc $mbr"
  }

  def isStep(l: String): Boolean = {
    l.startsWith("//STEP") || (l.startsWith("//") && l.contains(" EXEC "))
  }

  def captureStep(l: String): Step = {
    val name = l.stripPrefix("//").takeWhile(_ != ' ')
    val i1 = l.indexOf(" EXEC ")
    val part2 = if (i1 > 0) l.substring(i1+" EXEC".length) else ""
    val proc = part2.dropWhile(_ == ' ').takeWhile(_ != ',')
    val i2 = part2.indexOf("MBR=")
    val mbr = if (i2 > 0) part2.substring(i2+"MBR=".length).trim else ""
    Step(name, proc, mbr)
  }

  def captureSteps(lines: Iterator[String]): Iterator[Step] = {
    lines.filter(isStep)
      .map(captureStep)
  }

  def printSteps(src: DSN, zos: MVS): Unit = {
    val lines = zos.readDSNLines(src).take(10000)
    val filtered = lines.filterNot{s => s.startsWith("//*")||s.startsWith("// ")}
    if (filtered.hasNext){
      val steps = captureSteps(lines)
      while (steps.hasNext){
        val step = steps.next
        Console.err.println(s"$src ${step.proc} ${step.name} ${step.mbr}")
      }
    }
  }

  def copy(src: DSN, dest: DSN, limit: Int, exprs: Seq[(String,String)],
           zos: MVS): Result = {
    Console.out.println(s"$src -> $dest")
    if (zos.exists(dest)) {
      val msg = s"Error: $dest already exists"
      logger.error(msg)
      Console.err.println(msg)
      return Result.Failure(msg)
    } else if (!zos.exists(src)) {
      val msg = s"Error: $src doesn't exist"
      logger.error(msg)
      Console.err.println(msg)
      Result.Failure(msg)
    }

    val it1 = readWithReplacements(zos.readDSNLines(src), exprs, limit)
    logger.info(s"Opening RecordWriter $dest")
    val out = zos.writeDSN(dest)

    for (record <- it1)
      out.write(record.getBytes)

    out.close()
    logger.info(s"Copied ${out.count} lines from $src to $dest")
    Result.Success
  }
}
