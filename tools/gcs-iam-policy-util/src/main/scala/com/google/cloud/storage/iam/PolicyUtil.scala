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

import java.net.URI

import com.google.api.client.json.jackson2.JacksonFactory
import com.google.cloud.storage.iam.Model.{BucketPolicy, Identity, Prefix, Role, StorageAdmin}
import com.google.cloud.storage.iam.Util.{EnhancedStorage, PolicyMap}

import scala.collection.mutable.ArrayBuffer

object PolicyUtil {
  def main(args: Array[String]): Unit = {
    PolicyUtilConfigParser.parse(args, PolicyUtilConfig()) match {
      case Some(config) =>
        if (config.adminId.isEmpty) {
          System.err.println("valid admin identity is required")
          System.exit(1)
        }

        val gcs = Util.storageClient
        val cache = Util.loadCache(config.policyCacheUri, gcs, config.clearCache)
        val storage = new EnhancedStorage(gcs, cache)

        val errCount = applyPolicies(config, storage)

        Util.writeCache(config.policyCacheUri, storage.storage, storage.cache)
        if (errCount > 0) {
          System.err.println(s"Completed with $errCount errors")
          System.exit(1)
        }

      case None =>
        System.err.println(s"Failed to parse args '${args.mkString(" ")}'")
        System.exit(1)
    }
  }

  def applyPolicies(config: PolicyUtilConfig,
                    policyMap: PolicyMap): Unit = {
    // Resolve policies from configuration
    for ((zoneId, roleGrants) <- config.policies) {
      val prefixes = if (zoneId.startsWith("gs://")) {
        val uri = new URI(zoneId)
        Set(Prefix(uri.getAuthority, uri.getPath.stripPrefix("/")))
      } else {
        require(config.zones.contains(zoneId), s"undefined zone '$zoneId'")
        config.zones(zoneId)
      }

      // Expand role grants
      val roleSets: Seq[(Set[Role],Set[Identity])] = roleGrants.map{grant =>
        // Resolve identities
        val identities: Set[Identity] = grant.identity match {
          case s if s.startsWith("user:") =>
            config.parser.parseUser(s).map(Set(_)).getOrElse(Set.empty)
          case s if s.startsWith("group:") =>
            config.parser.parseGroup(s).map(Set(_)).getOrElse(Set.empty)
          case s if s.startsWith("serviceAccount:") =>
            config.parser.parseServiceAccount(s).map(Set(_)).getOrElse(Set.empty)
          case _ =>
            require(config.idSets.contains(grant.identity), s"undefined idSet '${grant.identity}'")
            config.idSets(grant.identity)
        }

        // Resolve role
        val roles: Set[Role] = Model.fromRole(grant.role) match {
          case Some(r) =>
            Set(r)
          case _ =>
            require(config.roleSets.contains(grant.role), s"undefined roleSet '${grant.role}'")
            config.roleSets(grant.role)
        }

        (roles, identities)
      }

      // Expand buckets
      val policies: Set[BucketPolicy] = if (zoneId.startsWith("gs://")) {
        val uri = new URI(zoneId)
        Set(Prefix(uri.getAuthority, uri.getPath.stripPrefix("/"))).map{prefix =>
          policyMap.getOrElseUpdate(prefix.bucket)
        }
      } else {
        require(config.zones.contains(zoneId), s"undefined zone '$zoneId'")
        config.zones(zoneId)
          .map{x =>
            require(policyMap.contains(x.bucket), s"uninitialized bucket policy '${x.bucket}'")
            policyMap(x.bucket)
          }
      }

      // Update bucket policies
      for {
        policy <- policies
        (roles, identities) <- roleSets
        role <- roles
        prefix <- prefixes
      } yield policy.grantAll(role, prefix, identities)
    }
  }

  def applyPolicies(config: PolicyUtilConfig,
                    storage: EnhancedStorage,
                    pause: Long = 100,
                    ttl: Long = Util.DefaultTTLSeconds): Long = {
    // Enumerate GCS buckets with defined policies
    val buckets = config.zones
      .foldLeft(new ArrayBuffer[String]()){(buf,zone) =>
        val bucketNames = zone._2.map(_.bucket)
        buf.appendAll(bucketNames); buf
      }.toSet

    // Initialize policy for each GCS bucket
    val policies: PolicyMap = Util.initializePolicies(buckets)

    applyPolicies(config, policies)

    // Apply policies
    if (policies.isEmpty)
      System.err.println("0 policies defined")
    var errCount = 0L
    for (policy <- policies.sorted) {
      policy.grantAll(StorageAdmin, Prefix(policy.bucketName), config.adminId)
      try {
        val updated = storage.update(policy, ttl, config.merge, config.keep, config.dryRun)
        if (updated.isDefined && pause > 0) {
          updated.get.setFactory(JacksonFactory.getDefaultInstance)
          System.out.println("Updated Policy:\n"+ updated.get.toPrettyString)
          Thread.sleep(pause)
        } else {
          System.out.println(s"Policy for bucket '${policy.bucketName}' unchanged")
        }
      } catch {
        case e: Exception =>
          errCount += 1
          System.err.println(s"Failed to update policy on gs://${policy.bucketName}: ${e.getMessage}")
          e.printStackTrace(System.err)
          if (pause > 0) Thread.sleep(pause)
      }
    }
    errCount
  }
}
