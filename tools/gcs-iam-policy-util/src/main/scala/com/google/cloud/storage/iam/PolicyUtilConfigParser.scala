/*
 * Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.google.cloud.storage.iam

import java.io.File
import java.net.URI
import java.nio.file.Paths

object PolicyUtilConfigParser
  extends scopt.OptionParser[PolicyUtilConfig]("GCSIamPolicyUtil") {
  head("GCSIamPolicyUtil", "0.1")

  opt[String]("adminIdentity")
    .required()
    .valueName("<value>")
    .validate(x =>
      if (x.startsWith("user:") ||
          x.startsWith("serviceAccount") ||
          x.startsWith("group:")) success
      else failure("adminIdentity must include 'user:' 'serviceAccount:' or 'group:' prefix"))
    .action((x, c) => c.copy(adminIdentity = x))
    .text("identity with admin privileges (format:{user|serviceAccount|group}:{email})")

  opt[String]("zones")
    .valueName("<URI|path>")
    .action((x, c) => c.copy(zonesUri =
      if (x.startsWith("gs://")) new URI(x) else Paths.get(x).toUri))
    .text("(optional) URI or path to zones.conf")

  opt[String]("idSets")
    .valueName("<URI|path>")
    .action((x, c) => c.copy(idSetsUri =
      if (x.startsWith("gs://")) new URI(x) else Paths.get(x).toUri))
    .text("(optional) URI or path to id_sets.conf")

  opt[String]("policies")
    .valueName("<URI|path>")
    .action((x, c) => c.copy(policiesUri =
      if (x.startsWith("gs://")) new URI(x) else Paths.get(x).toUri))
    .text("(optional) URI or path to policies.conf")

  opt[String]("roleSets")
    .valueName("<URI|path>")
    .action((x, c) => c.copy(roleSetsUri =
      if (x.startsWith("gs://")) new URI(x) else Paths.get(x).toUri))
    .text("(optional) URI or path to role_sets.conf")

  opt[String]("cache")
    .valueName("<URI|path>")
    .action((x, c) => c.copy(policyCacheUri =
      if (x.startsWith("gs://")) new URI(x) else Paths.get(x).toUri))
    .text("(optional) URI or path to policyCache.pb")

  opt[Seq[String]]("allowedDomains")
    .valueName("<domain>")
    .action((x, c) => c.copy(allowedDomains = x.toSet))
    .text("(optional) domain whitelist for authorization groups")

  opt[Seq[String]]("allowedProjects")
    .valueName("<projectId>")
    .action((x, c) => c.copy(allowedProjects = x.toSet))
    .text("(optional) project id whitelist for service accounts")

  opt[Boolean]("rmValidator")
    .action((x, c) => c.copy(rmValidator = x))
    .text("(optional) validate projects with Cloud Resource Manager (default: true)")

  opt[Long]("ttl")
    .action((x, c) => c.copy(ttlSeconds = x))
    .text("(optional) cache ttl in seconds; default 1 week")

  opt[Long]('w', "wait")
    .action((x, c) => c.copy(waitMs = x))
    .text("(optional) wait time between requests in milliseconds; default 100ms")

  opt[Unit]('m',"merge")
    .action((_, c) => c.copy(merge = true))
    .text("(flag) merge with existing policy")

  opt[Unit]('k',"keep")
    .action((_, c) => c.copy(keep = true))
    .text("(flag) keep bindings from existing policy during merge")

  opt[Unit]("clearCache")
    .action((_, c) => c.copy(clearCache = true))
    .text("(flag) clear policy cache")

  opt[Unit]("dryRun")
    .action((_, c) => c.copy(dryRun = true))
    .text("(flag) validate configuration and print policy changes without applying")

  help("help")
    .text("prints this usage text")

  note("running without arguments will load configuration from default location and overwrite any existing bucket IAM policies with the generated policies")
}
