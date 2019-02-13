/*
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.google.cloud.pso.sql

import com.google.common.io.Resources
import com.google.gson.JsonObject
import javax.servlet.http.{HttpServlet, HttpServletRequest, HttpServletResponse}
import org.eclipse.jetty.server.Server
import org.eclipse.jetty.servlet.{ServletContextHandler, ServletHolder}
import org.eclipse.jetty.server.handler.{HandlerList, ResourceHandler}

import scala.collection.JavaConverters.asScalaIteratorConverter

object SQLServlet {
  def success(sql: String): String = {
    val obj = new JsonObject()
    obj.addProperty("data", sql)
    obj.toString
  }

  def failure(msg: String): String = {
    val obj = new JsonObject()
    obj.addProperty("data", msg)
    obj.toString
  }

  def readSQL(req: HttpServletRequest): String = {
    val encoded: String = req.getReader.lines().iterator().asScala.mkString
    new String(java.util.Base64.getDecoder.decode(encoded))
  }


  case class App(path: String, servlet: HttpServlet)

  def main(args: Array[String]): Unit = {
    val apps = Seq(
      App("/sql", new SQLServlet(new StandardSQLParser))
    )
    start(8080, apps)
  }

  def start(port: Int, apps: Seq[App], initParameters: Seq[(String,String)] = Nil): Server = {
    val context = new ServletContextHandler(ServletContextHandler.SESSIONS)
    context.setContextPath("/")

    val rh = new ResourceHandler
    rh.setDirectoriesListed(false)
    rh.setDirAllowed(false)
    rh.setWelcomeFiles(Array[String]("index.htm"))
    val resourceBase: String = Resources.getResource("static").toURI.toURL.toString
    rh.setResourceBase(resourceBase)

    val handlers = new HandlerList
    handlers.setHandlers(Array(rh, context))

    initParameters.foreach{case (name, value) => context.setInitParameter(name, value)}

    val server = new Server(port)
    server.setHandler(handlers)
    apps.foreach{app =>
      val pathSpec = (app.path + "/*").replaceAll("//", "/")
      context.addServlet(new ServletHolder(app.servlet), pathSpec)
    }
    server.start()
    server
  }
}

class SQLServlet(val parser: SQLParser) extends HttpServlet {
  override def doPost(req: HttpServletRequest, resp: HttpServletResponse): Unit = {
    val sql = SQLServlet.readSQL(req)
    val result = parser.parseStatement(sql)
    resp.setContentType("application/json; charset=UTF-8")
    result match {
      case Left(err) =>
        resp.getWriter.print(SQLServlet.failure(err.msg))
      case Right(stmt) =>
        resp.getWriter.print(SQLServlet.success(stmt.fmt.print()))
    }
  }
}
