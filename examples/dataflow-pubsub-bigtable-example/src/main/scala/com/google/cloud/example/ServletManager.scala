/*
 * Copyright 2019 Google LLC All rights reserved.
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

package com.google.cloud.example

import javax.servlet.http.HttpServlet
import org.eclipse.jetty.server.Server
import org.eclipse.jetty.server.handler.HandlerList
import org.eclipse.jetty.servlet.{ServletContextHandler, ServletHolder}

object ServletManager {
  case class App(path: String, servlet: HttpServlet)

  def start(port: Int, apps: Seq[App], initParameters: Seq[(String,String)] = Nil): Server = {
    val context = new ServletContextHandler(ServletContextHandler.SESSIONS)
    context.setContextPath("/")

    initParameters.foreach{case (name, value) => context.setInitParameter(name, value)}

    apps.foreach{app =>
      val pathSpec = (app.path + "/*").replaceAll("//", "/")
      context.addServlet(new ServletHolder(app.servlet), pathSpec)
    }

    val server = new Server(port)
    val handlers = new HandlerList
    handlers.setHandlers(Array(context))
    server.setHandler(handlers)
    server.start()
    server
  }
}
