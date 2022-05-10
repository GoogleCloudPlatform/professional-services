package com.google.cloud.imf.util

import org.apache.logging.log4j.core.config.plugins.{Plugin, PluginAttribute, PluginConfiguration, PluginElement, PluginFactory}
import org.apache.logging.log4j.core.config.{Configuration, Node}
import org.apache.logging.log4j.core.layout.PatternLayout.DEFAULT_CONVERSION_PATTERN
import org.apache.logging.log4j.core.layout.{ByteBufferDestination, PatternLayout, PatternSelector}
import org.apache.logging.log4j.core.pattern.RegexReplacement
import org.apache.logging.log4j.core.{Layout, LogEvent, StringLayout}

import java.nio.charset.Charset
import java.util
import scala.annotation.tailrec

@Plugin(name = "SpoolConsoleLayout", category = Node.CATEGORY, elementType = Layout.ELEMENT_TYPE, printObject = true)
class SpoolConsoleLayout(splitSize: Int, delegate: StringLayout) extends StringLayout {

  override def getFooter: Array[Byte] = delegate.getFooter

  override def getHeader: Array[Byte] = delegate.getHeader

  override def getContentType: String = delegate.getContentType

  override def getContentFormat: util.Map[String, String] = delegate.getContentFormat

  override def encode(source: LogEvent, destination: ByteBufferDestination): Unit = {
    val logEventBytes = toByteArray(source)
    destination.writeBytes(logEventBytes, 0, logEventBytes.length)
  }

  override def toByteArray(event: LogEvent): Array[Byte] = toSerializable(event).getBytes(getCharset)

  override def getCharset: Charset = delegate.getCharset

  override def toSerializable(source: LogEvent): String = {
    def splitString(inputStr: String, n: Int, del: Char): Seq[String] = {
      @tailrec
      def splitString(inputStr: String, n: Int, acc: List[String] = List()): List[String] = inputStr match {
        case str if str.length <= n => acc ++ List(str)
        case str =>
          val splitIndex = str.lastIndexWhere(c => c == ' ' || c == '\t', n)
          val (firstNChars, otherChars) = str.splitAt(if (splitIndex == -1) n else splitIndex + 1)
          splitString(otherChars, n, acc ++ List(firstNChars))
      }

      inputStr.split(del).flatMap(splitString(_, n))
    }

    val logEventStr = delegate.toSerializable(source)
    splitString(logEventStr, splitSize, '\n').mkString("\n") + "\n"
  }

}

object SpoolConsoleLayout {

  private val DO_WRAPPING = sys.env.get("LOG_WRAP_SPOOL").flatMap(_.toBooleanOption).getOrElse(true)

  @PluginFactory
  def createLayout(@PluginAttribute(value = "pattern", defaultString = DEFAULT_CONVERSION_PATTERN) pattern: String,
                   @PluginElement("PatternSelector") patternSelector: PatternSelector,
                   @PluginConfiguration config: Configuration,
                   @PluginElement("Replace") replace: RegexReplacement,
                   @PluginAttribute(value = "charset") charset: Charset,
                   @PluginAttribute(value = "alwaysWriteExceptions", defaultBoolean = true) alwaysWriteExceptions: Boolean,
                   @PluginAttribute(value = "noConsoleNoAnsi") noConsoleNoAnsi: Boolean,
                   @PluginAttribute("header") headerPattern: String,
                   @PluginAttribute("footer") footerPattern: String,
                   @PluginAttribute(value = "splitSize", defaultInt = Integer.MAX_VALUE) splitSize: Int): StringLayout = {

    val defaultPatternLayout = PatternLayout.newBuilder()
      .withPattern(pattern)
      .withPatternSelector(patternSelector)
      .withConfiguration(config)
      .withRegexReplacement(replace)
      .withCharset(charset)
      .withAlwaysWriteExceptions(alwaysWriteExceptions)
      .withNoConsoleNoAnsi(noConsoleNoAnsi)
      .withHeader(headerPattern)
      .withFooter(footerPattern)
      .build()

    if (DO_WRAPPING) {
      new SpoolConsoleLayout(splitSize, defaultPatternLayout)
    } else {
      defaultPatternLayout
    }
  }

}
