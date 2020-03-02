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

import java.io.{File, IOException}
import java.net.URI
import java.nio.file.{Files, Paths}
import java.util.NoSuchElementException

import com.google.api.client.googleapis.json.GoogleJsonResponseException
import com.google.api.services.cloudresourcemanager.CloudResourceManager
import com.google.api.services.storage.Storage
import com.google.cloud.storage.iam.Model.{CustomRole, Group, Identity, Prefix, Role, ServiceAccount, User, fromRole}

import scala.collection.JavaConverters._
import scala.collection.mutable
import scala.collection.mutable.ListBuffer
import scala.io.Source

case class PolicyUtilConfig(ttlSeconds: Long = Util.DefaultTTLSeconds,
                            waitMs: Long = 100,
                            zonesUri: URI = Paths.get("zones.conf").toUri,
                            idSetsUri: URI = Paths.get("id_sets.conf").toUri,
                            policiesUri: URI = Paths.get("policies.conf").toUri,
                            roleSetsUri: URI = Paths.get("role_sets.conf").toUri,
                            policyCacheUri: URI = Paths.get("policy_cache.pb").toUri,
                            adminIdentity: String = "",
                            allowedDomains: Set[String] = Set.empty,
                            allowedProjects: Set[String] = Set.empty,
                            rmValidator: Boolean = true,
                            merge: Boolean = false,
                            keep: Boolean = false,
                            clearCache: Boolean = false,
                            dryRun: Boolean = false) {
  import PolicyUtilConfig._
  lazy val parser = ValidatingIdentityParser(
    domainValidator =
      if (allowedDomains.nonEmpty) new SetValidator(allowedDomains) else AcceptAllValidator,
    projectValidator =
      if (allowedProjects.nonEmpty) new SetValidator(allowedProjects)
      else if (rmValidator) new RMProjectValidator(Util.rmClient)
      else AcceptAllValidator)

  def adminId: Set[Identity] =
    parser.parseIdentity(adminIdentity).map(Set(_)).getOrElse(Set.empty)

  def idSets: Map[String,Set[Identity]] =
    readIdSets(idSetsUri, null, parser = parser)

  def roleSets: Map[String,Set[Role]] =
    readRoleSets(roleSetsUri, null)

  def policies: Map[String,Seq[RoleGrant]] =
    readPolicies(policiesUri, null)

  def zones: Map[String,Set[Prefix]] =
    readZones(zonesUri, null)
}

object PolicyUtilConfig {

  sealed trait ConfigLine
  case class Heading(value: String) extends ConfigLine
  case class Entry(values: Seq[String]) extends ConfigLine

  def stripComment(line: String): String = {
    val i = line.indexOf("#")
    if (i >= 0) {
      line.substring(0, i)
    } else line
  }

  def normalizeConfigLine(line: String): Seq[String] = {
    stripComment(line) // remove comment
      .trim // ignore leading and trailing whitespace
      .replaceAllLiterally("\t"," ") // handle tabs
      .split(' ')
      .filter(_.nonEmpty) // handle multiple spaces
  }

  def readConfigLine(line: String): Option[ConfigLine] = {
    line match {
      case s if s.startsWith("#") =>
        None
      case s if s.indexOf("[") == 0 && s.indexOf("]") > 1 && s.length >= 3 =>
        Option(Heading(s.substring(1, s.indexOf("]"))))
      case s if s.nonEmpty =>
        Option(Entry(normalizeConfigLine(s)))
      case _ =>
        None
    }
  }

  /** This is a shared trait that parses configurations from a file
    *
    * @tparam T type of configuration item to read
    */
  trait ConfigIterator[T] extends Iterator[T] {
    protected var nextGroup: Option[T] = None

    /** Function to load nextGroup */
    protected def advance(): Unit

    override def next(): T = {
      if (nextGroup.isEmpty) advance()
      if (nextGroup.isDefined) {
        val result = nextGroup.get
        nextGroup = None
        result
      } else {
        throw new NoSuchElementException("next on empty iterator")
      }
    }

    override def hasNext: Boolean = {
      if (nextGroup.isDefined) {
        true
      } else {
        advance()
        nextGroup.isDefined
      }
    }
  }

  /**
    *
    * @param role a role definition id from roles.conf
    * @param identity a zone id from groups.conf or identity
    */
  case class RoleGrant(role: String, identity: String)

  def parseRoleGrant(s: Seq[String]): RoleGrant =
    RoleGrant(s.head, s(1))

  trait IdentityParser {
    def parseIdentity(s: String): Option[Identity]
  }

  trait Validator {
    def validate(id: String): Boolean
  }
  case object AcceptAllValidator extends Validator {
    override def validate(id: String): Boolean = true
  }
  class RMProjectValidator(rm: CloudResourceManager) extends Validator {
    private val cache: mutable.Map[String,Long] = mutable.Map.empty
    override def validate(projectId: String): Boolean = {
      val t = System.currentTimeMillis
      val exp = t + (1000L * 60 * 60 * 24)
      cache.get(projectId) match {
        case Some(t0) if t0 < exp =>
          System.out.println(s"validated '$projectId' from cache")
          true
        case _ =>
          try {
            val project = rm.projects.get(projectId).execute
            if (project.getProjectId == projectId) {
              cache.update(projectId, t)
              System.out.println(s"validated '$projectId' from Resource Manager")
              true
            } else false
          } catch {
            case e: GoogleJsonResponseException if e.getDetails.getCode == 403 =>
              val msg = s"'$projectId' not accessible via Resource Manager"
              System.err.println(msg)
              throw new IllegalArgumentException(msg, e)
            case e: Exception =>
              val msg = s"Failed to validate '$projectId'"
              System.err.println(msg)
              throw new IllegalArgumentException(msg, e)
          }
      }
    }
  }
  class SetValidator(allow: Set[String]) extends Validator {
    override def validate(id: String): Boolean =
      allow.contains(id)
  }

  case class ValidatingIdentityParser(domainValidator: Validator = AcceptAllValidator,
                                      projectValidator: Validator = AcceptAllValidator)
    extends IdentityParser {
    override def parseIdentity(s: String): Option[Identity] =
      if (s.endsWith(".iam.gserviceaccount.com"))
        parseServiceAccount(s)
      else if (s.startsWith("user:")) parseUser(s)
      else parseGroup(s)

    def validateServiceAccount(s: String): Boolean = {
      val atSymbol = s.indexOf("@")
      if (atSymbol < 1) return false
      val dot = s.indexOf(".", atSymbol)
      val name = s.substring(0, atSymbol)
      val project = s.substring(atSymbol + 1, dot)
      name.length > 5 && project.length > 6 && projectValidator.validate(project)
    }

    def validate(s: String, group: Boolean = false): Boolean = {
      val atSymbol = s.indexOf("@")
      if (atSymbol < 1) return false
      val name = s.substring(0, atSymbol)
      val domain = s.substring(atSymbol + 1, s.length)
      name.length > 3 && domain.length > 5 && domain.count(_=='.') > 0 &&
        domainValidator.validate(domain)
    }

    def parseUser(s: String): Option[Identity] =
      if (validate(s.stripPrefix("user:"))) Option(User(s.stripPrefix("user:")))
      else None

    def parseGroup(s: String): Option[Identity] =
      if (validate(s.stripPrefix("group:"), group = true)) Option(Group(s.stripPrefix("group:")))
      else None

    def parseServiceAccount(s: String): Option[Identity] = {
      if (validateServiceAccount(s))
        Option(ServiceAccount(s.stripPrefix("serviceAccount:")))
      else None
    }
  }

  class PolicyIterator(lines: Iterator[ConfigLine])
    extends ConfigIterator[(String,Seq[RoleGrant])] {
    private var id: Option[String] = None
    private var nextId: Option[String] = None
    override def advance(): Unit = {
      if (lines.hasNext) {
        var continue = true
        val buf = ListBuffer.empty[RoleGrant]
        while (continue && lines.hasNext) {
          lines.next() match {
            case Heading(v) =>
              if (id.isEmpty) {
                id = Option(v)
              } else {
                nextId = Option(v)
                continue = false
              }
            case Entry(v) if v.length >= 2 =>
              buf.append(parseRoleGrant(v))
            case _ =>
          }
        }
        if (id.isDefined && buf.nonEmpty) {
          nextGroup = Option((id.get, buf.result()))
          id = nextId
        }
      }
    }
  }

  class IdentitiesIterator(lines: Iterator[ConfigLine], parser: IdentityParser)
    extends ConfigIterator[(String,Set[Identity])] {
    private var id: Option[String] = None
    private var nextId: Option[String] = None
    override def advance(): Unit = {
      if (lines.hasNext) {
        var continue = true
        val buf = mutable.Set.empty[Identity]
        while (continue && lines.hasNext) {
          lines.next() match {
            case Heading(v) =>
              if (id.isEmpty) {
                id = Option(v)
              } else {
                nextId = Option(v)
                continue = false
              }
            case Entry(v) if v.nonEmpty =>
              parser.parseIdentity(v.head) match {
                case Some(identity) => buf.add(identity)
                case _ =>
                  System.err.println(s"invalid identity '${v.head}'")
              }
            case _ =>
          }
        }
        if (id.isDefined && buf.nonEmpty){
          nextGroup = Option((id.get, buf.toSet))
          id = nextId
        }
      }
    }
  }

  class ZonesIterator(lines: Iterator[ConfigLine])
    extends ConfigIterator[(String,Set[Prefix])] {
    private var id: Option[String] = None
    private var nextId: Option[String] = None
    override def advance(): Unit = {
      if (lines.hasNext) {
        var continue = true
        val buf = mutable.Set.empty[Prefix]
        while (continue && lines.hasNext) {
          lines.next() match {
            case Heading(v) =>
              if (id.isEmpty) {
                id = Option(v)
              } else {
                nextId = Option(v)
                continue = false
              }
            case Entry(v) if v.nonEmpty =>
              buf.add(Prefix(v.head, v.lift(1).getOrElse("")))
            case _ =>
              continue = false
          }
        }
        if (id.isDefined && buf.nonEmpty) {
          nextGroup = Option((id.get, buf.result().toSet))
          id = nextId
        }
      }
    }
  }

  class RolesIterator(lines: Iterator[ConfigLine])
    extends ConfigIterator[(String, Seq[Role])] {
    private var id: Option[String] = None
    private var nextId: Option[String] = None
    override def advance(): Unit = {
      if (lines.hasNext) {
        var continue = true
        val buf = ListBuffer.empty[Role]
        while (continue && lines.hasNext) {
          lines.next() match {
            case Heading(v) =>
              if (id.isEmpty) {
                id = Option(v)
              } else {
                nextId = Option(v)
                continue = false
              }
            case Entry(v) if v.nonEmpty =>
              parseGCSRole(v).foreach(x => buf.append(x))
            case _ =>
          }
        }
        if (id.isDefined && buf.nonEmpty) {
          nextGroup = Option((id.get, buf.result()))
          id = nextId
        }
      }
    }
  }

  def lines(uri: URI, storage: Storage, allowEmpty: Boolean = false): Seq[String] = {
    if (uri.getScheme == "gs") gcsLines(uri, storage)
    else fileLines(uri.getPath, allowEmpty)
  }

  def gcsLines(uri: URI, storage: Storage): Seq[String] =
    Source.fromInputStream(
      storage.objects.get(uri.getAuthority, uri.getPath).executeMediaAsInputStream
    ).getLines.toArray.toSeq

  def fileLines(path: String, allowEmpty: Boolean = false): Seq[String] = {
    val p = Paths.get(path)
    if (Files.isRegularFile(p)) {
      Files.readAllLines(p).asScala.toArray.toSeq
    } else if (allowEmpty) {
      Seq.empty
    } else {
      throw new IOException(s"$path not found")
    }
  }

  def readIdSets(uri: URI, storage: Storage, parser: IdentityParser): Map[String, Set[Identity]] =
    readIdSets(lines(uri, storage, allowEmpty = true), parser).toMap

  def readPolicies(uri: URI, storage: Storage): Map[String,Seq[RoleGrant]] =
    readPolicies(lines(uri, storage)).toMap

  def readRoleSets(uri: URI, storage: Storage): Map[String,Set[Role]] =
    readRoleSets(lines(uri, storage, allowEmpty = true).iterator)

  def readZones(uri: URI, storage: Storage): Map[String,Set[Prefix]] =
    readZones(lines(uri, storage, allowEmpty = true).toIterator).toMap

  def readZones(lines: Iterator[String]): Seq[(String,Set[Prefix])] = {
    val configLines = lines.flatMap(readConfigLine)
    new ZonesIterator(configLines).toArray.toSeq
  }

  def readIdSets(lines: TraversableOnce[String],
                 parser: IdentityParser): Seq[(String, Set[Identity])] = {
    val configLines = lines.toIterator.flatMap(readConfigLine)
    new IdentitiesIterator(configLines, parser).toArray.toSeq
  }

  def readPolicies(lines: TraversableOnce[String]): Seq[(String,Seq[RoleGrant])] = {
    val configLines = lines.toIterator.flatMap(readConfigLine)
    new PolicyIterator(configLines).toArray.toSeq
  }

  def parseGCSRole(fields: Seq[String]): Option[Role] = {
    if (fields.length == 2)
      Option(CustomRole(fields.head, fields(1)))
    else if (fields.length == 1)
      fromRole(fields.head)
    else None
  }

  def readRoleSets(lines: Iterator[String]): Map[String,Set[Role]] = {
    val configLines = lines.flatMap(readConfigLine)
    new RolesIterator(configLines).toMap.mapValues(_.toSet)
  }

  def filesExist(files: java.io.File*): Boolean =
    files.count{f =>
      if (!f.exists) {
        System.err.println(s"$f not found")
        true
      } else false
    } == 0
}
