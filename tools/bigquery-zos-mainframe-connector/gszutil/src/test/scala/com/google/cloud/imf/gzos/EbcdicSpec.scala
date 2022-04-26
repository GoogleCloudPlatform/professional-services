package com.google.cloud.imf.gzos

import org.scalatest.flatspec.AnyFlatSpec
import sun.nio.cs.ext.IBM1047

import java.nio.ByteBuffer
import java.nio.charset.{Charset, StandardCharsets}
import java.nio.file.{Files, Paths, StandardOpenOption}

class EbcdicSpec extends AnyFlatSpec {
  "EBCDIC" should "write" in {
    val cs = new IBM1047()
    val bytes = (0 until 256).map(_.toByte).toArray
    val charBuf = cs.newDecoder().decode(ByteBuffer.wrap(bytes))
    val chars = charBuf.array()
    chars.update(186, '[')
    chars.update(187, ']')
    chars.update(176, '^')
    val bytes1 = cs.newEncoder().encode(charBuf).array()
    Files.write(Paths.get("src/main/resources/ebcdic.dat"), bytes1,
      StandardOpenOption.CREATE, StandardOpenOption.WRITE)

    val bytesUtf8 = new String(chars).getBytes(StandardCharsets.UTF_8)
    Files.write(Paths.get("src/main/resources/ebcdic.txt"), bytesUtf8,
      StandardOpenOption.CREATE, StandardOpenOption.WRITE)
  }

  it should "read Cp1047 and Cp037" in {
    val bytesInCp1047 = "[]^".getBytes(Charset.forName("Cp1047"))
    val bytesInCp037 = "[]^".getBytes(Charset.forName("Cp037"))
    val ebcdic = new EBCDIC1
    val stringFromCp1047 = ebcdic.decode(ByteBuffer.wrap(bytesInCp1047)).toString
    val stringFromCp037 = ebcdic.decode(ByteBuffer.wrap(bytesInCp037)).toString
    assert("[]^" == stringFromCp1047)
    assert("[]^" == stringFromCp037)
  }

  it should "write as Cp1047 only" in {
    val customEbcdicBytes = "[]^".getBytes(new EBCDIC1)
    val bytesInCp1047 = "[]^".getBytes(Charset.forName("Cp1047"))
    val bytesInCp037 = "[]^".getBytes(Charset.forName("Cp037"))
    assert(java.util.Arrays.equals(customEbcdicBytes, bytesInCp1047))
    assert(!java.util.Arrays.equals(customEbcdicBytes, bytesInCp037))
  }

  it should "match IBM1047" in {
    val ebcdic = new EBCDIC1
    val ibm1047 = new IBM1047
    val bytes = (0 until 256).map(_.toByte).toArray
    val actual = ebcdic.decode(ByteBuffer.wrap(bytes)).toString.toCharArray.toIndexedSeq
    val expected = ibm1047.decode(ByteBuffer.wrap(bytes)).toString.toCharArray
    expected.update(186, '[')
    expected.update(187, ']')
    expected.update(176, '^')
    val expected1 = expected.toIndexedSeq
    assert(actual == expected1)
  }
}
