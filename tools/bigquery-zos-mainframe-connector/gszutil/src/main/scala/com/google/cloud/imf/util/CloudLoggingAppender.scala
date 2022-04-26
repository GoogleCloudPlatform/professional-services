package com.google.cloud.imf.util

import com.google.api.services.logging.v2.Logging
import com.google.api.services.logging.v2.model.{LogEntry, MonitoredResource, WriteLogEntriesRequest}
import com.google.auth.Credentials
import com.google.cloud.imf.gzos.Util
import org.apache.commons.lang3.exception.ExceptionUtils
import org.apache.logging.log4j.Level
import org.apache.logging.log4j.core._
import org.apache.logging.log4j.core.appender.{AbstractAppender, NullAppender}
import org.apache.logging.log4j.core.config.plugins.{Plugin, PluginAttribute, PluginElement, PluginFactory}

import java.util.Collections
import scala.sys.env
import scala.util.Try

@Plugin(name = "CloudLoggingAppender", category = Core.CATEGORY_NAME, elementType = Appender.ELEMENT_TYPE, printObject = true)
class CloudLoggingAppender(name: String, projectId: String, logId: String, credentials: Credentials, ignoreExceptions: Boolean,
                           filter: Filter, layout: Layout[_ <: Serializable])
  extends AbstractAppender(name, filter, layout, ignoreExceptions, Array.empty) {

  private final val Global = new MonitoredResource().setType("global")
  private final val logName = s"projects/$projectId/logs/$logId"
  private final val logger: Logging = Services.logging(credentials)

  override def append(event: LogEvent): Unit = {
    //todo add event buffering here
    try {
      val entry: LogEntry = new LogEntry()
        .setJsonPayload(toMap(event))
        .setLogName(logName)
        .setResource(Global)
        .setSeverity(toSeverity(event.getLevel))

      val req = new WriteLogEntriesRequest()
        .setLogName(logName)
        .setResource(Global)
        .setEntries(Collections.singletonList(entry))

      logger.entries.write(req).execute
    } catch {
      case e: Exception =>
        System.out.println(s"Cloud logger failed to log. project=$projectId, logId=$logId, err=${e.getMessage}.")
    }
  }

  private def toMap(e: LogEvent): java.util.Map[String, Object] = {
    val m = new java.util.HashMap[String, Any]
    m.put("logger", e.getLoggerName)
    m.put("thread", e.getThreadName)
    m.put("msg", Option(e.getMessage).map(_.getFormattedMessage).getOrElse("Empty message"))
    m.put("timestamp", e.getTimeMillis)
    if (e.getThrown != null) {
      m.put("stackTrace", ExceptionUtils.getStackTrace(e.getThrown))
    }
    m.asInstanceOf[java.util.Map[String, Object]]
  }

  /**
    * @return severity values based on {@link com.google.logging.`type`.LogSeverity}
    */
  private def toSeverity(l: Level): String = {
    l match {
      case Level.OFF => "OFF"
      case Level.FATAL => "CRITICAL"
      case Level.ERROR => "ERROR"
      case Level.WARN => "WARNING"
      case Level.INFO => "INFO"
      case Level.DEBUG => "DEBUG"
      case Level.TRACE => "DEBUG"
      case _ => "INFO"
    }
  }
}

object CloudLoggingAppender {

  @PluginFactory
  def createAppender(@PluginAttribute("name") name: String,
                     @PluginAttribute(value = "ignoreExceptions", defaultBoolean = true) ignoreExceptions: Boolean,
                     @PluginElement("Filter") filter: Filter,
                     @PluginElement("Layout") layout: Layout[_ <: Serializable]) = {

    val maybeCloudAppender: Option[CloudLoggingAppender] = for {
      projectId <- env.get("LOG_PROJECT").filter(_.nonEmpty)
      logId <- env.get("LOG_ID").filter(_.nonEmpty)
      cred <- Try(Util.zProvider.getCredentialProvider().getCredentials).toOption
    } yield {
      System.out.println(s"Cloud Logging starts for:\n\tprojectId=$projectId\n\tlogId=$logId")
      new CloudLoggingAppender(name, projectId, logId, cred, ignoreExceptions, filter, layout)
    }

    maybeCloudAppender.getOrElse({
      System.out.println("Cloud Logging is disabled.\n\tEnvironment variables LOG_PROJECT or LOG_ID are blank.");
      NullAppender.createAppender(name)
    })

  }

}
