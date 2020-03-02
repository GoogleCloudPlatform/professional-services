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

import com.google.api.client.json.jackson2.JacksonFactory
import com.google.api.services.storage.model.{Expr, Policy}
import com.google.cloud.storage.iam.Util.IdentityOrdering

import scala.collection.JavaConverters._
import scala.collection.mutable


object Model {
  case class PolicyMembership(unexpected: Set[String], missing: Set[String])

  sealed trait Identity {
    def id: String
    override def hashCode(): Int = id.hashCode
  }
  case class ServiceAccount(email: String) extends Identity {
    override def id: String = s"serviceAccount:$email"
  }
  case class User(email: String) extends Identity {
    override def id: String = s"user:$email"
  }
  case class Group(email: String) extends Identity {
    override def id: String = s"group:$email"
  }
  case object AllAuthenticatedUsers extends Identity {
    override def id: String = "allAuthenticatedUsers"
  }
  case object AllUsers extends Identity {
    override def id: String = "allUsers"
  }

  sealed trait Role {
    def id: String
    override def toString: String = id
    override def hashCode(): Int = id.hashCode
  }
  case object ObjectViewer extends Role {
    override def id: String = "roles/storage.objectViewer"
  }
  case object ObjectCreator extends Role {
    override def id: String = "roles/storage.objectCreator"
  }
  case object ObjectAdmin extends Role {
    override def id: String = "roles/storage.objectAdmin"
  }
  case object StorageAdmin extends Role {
    override def id: String = "roles/storage.admin"
  }
  case class CustomRole(project: String, roleName: String) extends Role {
    override def id: String = s"projects/$project/roles/$roleName"
  }

  class Members(val role: Role) {
    private val members: mutable.Set[Identity] = mutable.Set.empty[Identity]
    override def toString: String = role.id
    override def hashCode(): Int = role.id.hashCode
    def += (identity: Identity): Unit = members.add(identity)
    def ++= (identities: TraversableOnce[Identity]): Unit =
      identities.foreach(members.add)
    def ids: Seq[Identity] = {
      val arr = members.toArray
      scala.util.Sorting.quickSort(arr)(IdentityOrdering)
      arr.toSeq
    }
    def remove(identity: Identity): Unit =
      members.remove(identity)
  }

  class RoleMap(val prefix: Prefix) {
    private val members: mutable.Map[Role,Members] = mutable.Map.empty
    def grant(role: Role, identity: Identity): Unit =
      members.getOrElseUpdate(role, new Members(role)) += identity
    def grantAll(role: Role, identities: TraversableOnce[Identity]): Unit =
      members.getOrElseUpdate(role, new Members(role)) ++= identities
    def grantAllRoles(roles: TraversableOnce[Role], identities: TraversableOnce[Identity]): Unit =
      for (role <- roles) grantAll(role, identities)

    def revoke(role: Role): Unit =
      members.remove(role)

    def revoke(role: Role, identity: Identity): Unit =
      members.get(role).foreach(_.remove(identity))

    def bindings: Iterator[Policy.Bindings] =
      members.iterator.map{x =>
        binding(prefix, x._2.role, x._2.ids)
      }
  }

  case class Prefix(bucket: String, prefix: String = "") {
    private def prefixUri: String = s"projects/_/buckets/$bucket/objects/$prefix"
    def expression: Expr = new Expr().setExpression(s"""resource.name.startsWith("$prefixUri")""")
    override def toString: String = s"gs://$bucket/$prefix"
    override def hashCode(): Int = toString.hashCode
  }

  class PolicyBuilder {
    private val buf: mutable.Buffer[Policy.Bindings] = mutable.ListBuffer.empty
    def append(role: RoleMap): PolicyBuilder = {
      role.bindings.foreach(buf.append(_))
      this
    }

    def appendAll(roles: TraversableOnce[RoleMap]): PolicyBuilder = {
      for (role <- roles)
        append(role)
      this
    }

    def result: Policy = {
      val res = new Policy().setBindings(buf.toList.asJava).setVersion(3)
      res.setFactory(JacksonFactory.getDefaultInstance)
      res
    }
  }

  def binding(condition: Prefix,
              role: Role,
              members: TraversableOnce[Identity]): Policy.Bindings = {
    val bindings = new Policy.Bindings()
      .setRole(role.id)
      .setMembers(members.toList.map(_.id).asJava)

    if (condition.prefix.nonEmpty)
      bindings.setCondition(condition.expression)

    bindings
  }

  def fromRole(role: String): Option[Role] = {
    role match {
      case s if s == ObjectViewer.id => Option(ObjectViewer)
      case s if s == ObjectCreator.id =>Option(ObjectCreator)
      case s if s == ObjectAdmin.id => Option(ObjectAdmin)
      case s if s == StorageAdmin.id => Option(StorageAdmin)
      case s if s.startsWith("projects/") && s.contains("/roles/") =>
        val fields = s.split('/')
        Option(CustomRole(fields(1),fields(3)))
      case _ =>
        None
    }
  }

  def fromMember(member: String): Identity = {
    member match {
      case s if s == "allAuthenticatedUsers" => AllAuthenticatedUsers
      case s if s == "allUsers" => AllUsers
      case s if s.startsWith("user:") => User(s.stripPrefix("user:"))
      case s if s.startsWith("serviceAccount:") => User(s.stripPrefix("serviceAccount:"))
      case s if s.startsWith("group:") => User(s.stripPrefix("group:"))
      case _ => throw new IllegalArgumentException(s"invalid member: '$member'")
    }
  }

  def fromMembers(members: java.util.List[String]): Seq[Identity] =
    members.asScala.map(fromMember).toArray.toSeq

  def fromExpr(expr: String, bucketName: String): Prefix = {
    if (expr.nonEmpty) {
      val bktIdx = expr.indexOf("/buckets/")
      val objIdx = expr.indexOf("/object/")
      Prefix(bucketName,
        expr.substring(objIdx + 8, expr.length - 2))
    } else Prefix(bucketName, "")
  }

  /** Used to model a bucket's IAM policies
    */
  class BucketPolicy(val bucketName: String) {
    private val policy: mutable.Map[Prefix,RoleMap] = mutable.Map.empty

    def getOrElseUpdate(prefix: Prefix): RoleMap =
      policy.getOrElseUpdate(prefix, new RoleMap(prefix))

    def result: Policy = new PolicyBuilder().appendAll(policy.values).result

    def grant(role: Role, prefix: Prefix, identity: Identity): Unit =
      getOrElseUpdate(prefix).grant(role, identity)

    def grantAll(role: Role, prefix: Prefix, identities: TraversableOnce[Identity]): Unit =
      getOrElseUpdate(prefix).grantAll(role, identities)

    def revoke(role: Role, prefix: Prefix): Unit =
      policy.get(prefix).foreach{_.revoke(role)}

    def revoke(role: Role, prefix: Prefix, identity: Identity): Unit =
      policy.get(prefix).foreach(_.revoke(role,identity))

    override def toString: String = result.toPrettyString
  }
}
