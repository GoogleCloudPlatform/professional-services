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

import java.io.{File, FileInputStream}
import java.net.URI
import java.nio.file.{Files, Paths, StandardOpenOption}

import com.google.api.client.http.{ByteArrayContent, HttpTransport}
import com.google.api.client.http.apache.v2.ApacheHttpTransport
import com.google.api.client.json.JsonFactory
import com.google.api.client.json.jackson2.JacksonFactory
import com.google.api.services.cloudresourcemanager.CloudResourceManager
import com.google.api.services.storage.Storage
import com.google.api.services.storage.model.{Policy, StorageObject}
import com.google.auth.http.HttpCredentialsAdapter
import com.google.auth.oauth2.GoogleCredentials
import com.google.cloud.storage.iam.Model.{BucketPolicy, Identity, Role}
import com.google.cloud.storage.iam.PolicyCache.Hash
import com.google.common.base.Charsets.UTF_8
import com.google.common.hash.Hashing

import scala.collection.JavaConverters._
import scala.collection.mutable
import scala.collection.mutable.ArrayBuffer

object Util {

  /** Calculates a SHA256 hash of a policy
    * Used to identify whether a policy has changed
    * @param policy IAM policy to be hashed
    * @return
    */
  def hash(policy: Policy): String =
    hashBindings(policy.getBindings)

  def hash(binding: Policy.Bindings): String = {
    hash(Option(binding.getCondition).map(_.getExpression).getOrElse(""),
      binding.getRole,
      binding.getMembers.asScala.toArray)
  }

  def hash(expr: String, role: String, members: Array[String]): String = {
    scala.util.Sorting.quickSort(members)
    val h = Hashing.sha256.newHasher
    h.putString(expr, UTF_8)
    h.putString(role, UTF_8)
    members.foreach(h.putString(_, UTF_8))
    h.hash.toString
  }

  def hashBindings(bindings: java.util.List[Policy.Bindings]): String =
    bindings.iterator().asScala
      .foldLeft(mutable.SortedSet.empty[String]){(a,b) => a.add(hash(b)); a}
      .foldLeft(Hashing.sha256.newHasher){(a,b) => a.putString(b,UTF_8); a}
      .hash.toString

  class EnhancedPolicy(x: Policy) {
    def roleSet: Set[(String,String)] =
      x.getBindings.asScala.foldLeft(mutable.ArrayBuffer.empty[(String,String)]){(a,b) =>
          val expr = Option(b.getCondition).map(_.getExpression).getOrElse("")
          a.append((b.getRole,expr)); a
      }.toSet

    def filter(role: String, expr: String): Seq[Policy.Bindings] =
      x.getBindings.asScala.filter{b => b.getRole == role &&
        Option(b.getCondition).map(_.getExpression).getOrElse("") == expr}
  }

  case class PolicyDiffEntry(role: String, prefix: String) {
    override def toString: String = s"role: $role prefix: $prefix"
  }

  case class MergePolicyResult(policy: Policy,
                               added: Seq[PolicyDiffEntry],
                               removed: Seq[PolicyDiffEntry]) {
    def diff: String = {
      s"""added:
         |${added.mkString("\t","\n\t","")}
         |removed:
         |${removed.mkString("\t","\n\t","")}""".stripMargin
    }
  }

  /**
    *
    * @param lp existing policy
    * @param rp new policy
    * @param keep keep bindings from existing policy not found in new policy
    * @return
    */
  def mergePolicies(lp: Policy, rp: Policy, keep: Boolean): MergePolicyResult = {
    val p = new BucketPolicy(lp.getResourceId.stripPrefix("projects/_/buckets/"))
    val l = new EnhancedPolicy(lp)
    val r = new EnhancedPolicy(rp)
    val lRoles = new EnhancedPolicy(lp).roleSet
    val rRoles = new EnhancedPolicy(rp).roleSet

    val leftOnly = lRoles.diff(rRoles)
    val rightOnly = rRoles.diff(lRoles)
    val both = rRoles.diff(rightOnly)

    // add new
    for ((role,expr) <- rightOnly) {
      val rm = Model.fromRole(role).get
      val cm = Model.fromExpr(expr, p.bucketName)
      val newIds = r.filter(role, expr).flatMap(x => Model.fromMembers(x.getMembers))
      p.grantAll(rm, cm, newIds)
    }
    val added: Seq[PolicyDiffEntry] = {
      val arr = rightOnly.foldLeft(new ArrayBuffer[PolicyDiffEntry](rightOnly.size)){(a,b) =>
        a.append(PolicyDiffEntry(b._1, b._2)); a}.result.toArray
      scala.util.Sorting.quickSort(arr)(PolicyDiffEntryOrdering)
      arr.toSeq
    }

    // merge common
    for ((role,expr) <- both) {
      val rm = Model.fromRole(role).get
      val cm = Model.fromExpr(expr, p.bucketName)
      val lMembers = l.filter(role, expr).flatMap(x => Model.fromMembers(x.getMembers)).toSet
      val rMembers = r.filter(role, expr).flatMap(x => Model.fromMembers(x.getMembers)).toSet
      p.grantAll(rm,cm,lMembers)
      p.grantAll(rm,cm,rMembers)

      if (!keep)
        for (identity <- lMembers.diff(rMembers))
          p.revoke(rm, cm, identity)
    }

    // remove old
    if (!keep) {
      for ((role, expr) <- leftOnly) {
        Model.fromRole(role) match {
          case Some(x) =>
            p.revoke(x, Model.fromExpr(expr, p.bucketName))
          case _ =>
            System.err.println(s"failed to parse role $role")
        }
      }
    }

    val removed: Seq[PolicyDiffEntry] = {
      val arr = leftOnly.foldLeft(new ArrayBuffer[PolicyDiffEntry](leftOnly.size)){(a,b) =>
        a.append(PolicyDiffEntry(b._1, b._2)); a}.result.toArray
      scala.util.Sorting.quickSort(arr)(PolicyDiffEntryOrdering)
      arr.toSeq
    }

    MergePolicyResult(p.result, added, removed)
  }

  class PolicyMap {
    private val policies = mutable.Map.empty[String,BucketPolicy]
    def getOrElseUpdate(bucketName: String): BucketPolicy =
      policies.getOrElseUpdate(bucketName, new BucketPolicy(bucketName))
    def contains(bucketName: String): Boolean =
      policies.contains(bucketName)
    def apply(bucketName: String): BucketPolicy =
      policies.apply(bucketName)

    def sorted: Seq[BucketPolicy] = {
      val a = policies.values.toArray
      scala.util.Sorting.quickSort(a)(BucketPolicyOrdering)
      a.toSeq
    }

    def isEmpty: Boolean = policies.isEmpty
    def nonEmpty: Boolean = policies.nonEmpty
  }

  def initializePolicies(buckets: TraversableOnce[String]): PolicyMap =
    buckets.foldLeft(new PolicyMap){(a,b) =>
      a.getOrElseUpdate(b); a
    }

  def initCache(policies: TraversableOnce[BucketPolicy]): PolicyCache = {
    val c = PolicyCache.newBuilder
    val t = System.currentTimeMillis
    c.setTimestamp(t)
    for (policy <- policies) {
      val h = hash(policy.result)
      val cached = Hash.newBuilder
        .setTimestamp(t)
        .setSha256(h)
        .build
      c.putBucket(policy.bucketName, cached)
    }
    c.build
  }

  def clearCache(uri: URI, storage: Storage): Unit = {
    if (uri.getScheme == "gs") {
      storage.objects.delete(uri.getAuthority, uri.getPath).execute
    } else {
      val path = Paths.get(uri)
      if (Files.isRegularFile(path)){
        Files.write(Paths.get(uri),
          PolicyCache.getDefaultInstance.toByteArray,
          StandardOpenOption.CREATE,
          StandardOpenOption.WRITE,
          StandardOpenOption.TRUNCATE_EXISTING,
          StandardOpenOption.SYNC)
      } else throw new RuntimeException(s"$uri is not a cache file")
    }
  }

  def writeCache(uri: URI, storage:Storage, cache: EnhancedPolicyCache): Unit = {
    if (uri.getScheme == "gs"){
      val obj = new StorageObject().setName(uri.getPath).setContentType("application/protobuf")
      val content = new ByteArrayContent("application/protobuf", cache.toByteArray)
      storage.objects.insert(uri.getAuthority, obj, content)
    } else {
      Files.write(Paths.get(uri.getPath),
                  cache.toByteArray,
                  StandardOpenOption.CREATE,
                  StandardOpenOption.WRITE,
                  StandardOpenOption.TRUNCATE_EXISTING,
                  StandardOpenOption.SYNC)
    }
  }

  def loadCache(uri: URI, storage: Storage, clearCache: Boolean = false): EnhancedPolicyCache = {
    if (uri.getScheme == "gs"){
      if (clearCache) {
        val cache = new EnhancedPolicyCache(PolicyCache.newBuilder)
        writeCache(uri, storage, cache)
        cache
      } else {
        val is = storage.objects.get(uri.getAuthority, uri.getPath).executeMediaAsInputStream()
        new EnhancedPolicyCache(PolicyCache.parseFrom(is).toBuilder)
      }
    } else {
      val path = Paths.get(uri)
      if (!Files.exists(path) || clearCache) {
        val cache = PolicyCache.getDefaultInstance
        Files.write(path, cache.toByteArray)
        new EnhancedPolicyCache(cache.toBuilder)
      } else if (Files.isRegularFile(path)) {
        val cache = PolicyCache.parseFrom(Files.readAllBytes(path))
        new EnhancedPolicyCache(cache.toBuilder)
      } else throw new RuntimeException(s"$uri is not a cache file")
    }
  }

  val DefaultTTLSeconds: Long = 60L * 60L * 24L * 7L // One week

  class EnhancedPolicyCache(private val c: PolicyCache.Builder) {
    def toByteArray: Array[Byte] = c
      .setTimestamp(System.currentTimeMillis)
      .build().toByteArray

    def update(bucket: String, p: Policy, ttl: Long, dryRun: Boolean): Boolean = {
      val h = hash(p)
      System.out.println(s"Policy SHA256: $h")
      val t = System.currentTimeMillis
      val expiration = math.min(t, t - (ttl*1000L))
      val cached = c.getBucketOrDefault(bucket, PolicyCache.Hash.getDefaultInstance)
      System.out.println(s"Cached SHA256: ${cached.getSha256}")
      if (cached.getSha256 != h || cached.getTimestamp < expiration) {
        val updated = Hash.newBuilder()
          .setSha256(h)
          .setTimestamp(t)
          .build()
        if (!dryRun)
          c.putBucket(bucket, updated)
        true
      } else false
    }
  }

  private val CloudPlatformReadOnly = "https://www.googleapis.com/auth/cloud-platform.read-only"
  private val DevStorageFullControl = "https://www.googleapis.com/auth/devstorage.full_control"

  def credentials: GoogleCredentials =
    GoogleCredentials.getApplicationDefault
      .createScoped(DevStorageFullControl, CloudPlatformReadOnly)

  @transient
  protected val Transport: HttpTransport = new ApacheHttpTransport()
  protected val Json: JsonFactory = JacksonFactory.getDefaultInstance
  val AppName: String = "gcs-iam-conditions"

  def rmClient: CloudResourceManager =
    new CloudResourceManager.Builder(Transport, Json,
      new HttpCredentialsAdapter(credentials))
      .setApplicationName(AppName)
      .build

  def storageClient: Storage =
    new Storage.Builder(new ApacheHttpTransport(),
                        JacksonFactory.getDefaultInstance,
                        new HttpCredentialsAdapter(credentials))
      .setApplicationName(AppName).build()

  class EnhancedStorage(val storage: Storage,
                        val cache: EnhancedPolicyCache) {
    private var cacheHit: Long = 0
    private var cacheMiss: Long = 0
    def getHitCount: Long = cacheHit
    def getMissCount: Long = cacheMiss

    /** Update GCS Bucket IAM policy
      *
      * @param p BucketPolicy to be applied
      * @param ttl cache entry TTL in seconds
      * @param merge combine existing policy
      * @param keep keep existing bindings not found in new policy
      * @return
      */
    def update(p: BucketPolicy, ttl: Long, merge: Boolean, keep: Boolean, dryRun: Boolean)
    : Option[Policy] = {
      val newPolicy: Policy = p.result
      // check if policy is cached
      if (cache.update(p.bucketName, newPolicy, ttl, dryRun)) {
        cacheMiss += 1
        val currentPolicy: Policy = storage.buckets
          .getIamPolicy(p.bucketName)
          .setOptionsRequestedPolicyVersion(3).execute
        System.out.println("Current policy:\n" +
          JacksonFactory.getDefaultInstance.toPrettyString(currentPolicy))
        if (hash(currentPolicy) != hash(newPolicy)) {
          val merged = mergePolicies(currentPolicy, newPolicy, keep)
          System.out.println(merged.diff)
          if (merge) {
            if (dryRun) Option(merged.policy)
            else Option(storage.buckets.setIamPolicy(p.bucketName, merged.policy).execute)
          } else {
            if (dryRun) Option(newPolicy)
            else Option(storage.buckets.setIamPolicy(p.bucketName, newPolicy).execute)
          }
        } else None
      } else {
        cacheHit += 1
        None
      }
    }
  }

  object RoleOrdering extends Ordering[Role] {
    override def compare(x: Role, y: Role): Int = {
      if (x.id < y.id) -1
      else if (y.id > x.id) 1
      else 0
    }
  }

  object IdentityOrdering extends Ordering[Identity] {
    override def compare(x: Identity, y: Identity): Int = {
      if (x.id < y.id) -1
      else if (y.id > x.id) 1
      else 0
    }
  }

  object BucketPolicyOrdering extends Ordering[BucketPolicy] {
    override def compare(x: BucketPolicy, y: BucketPolicy): Int = {
      if (x.bucketName < y.bucketName) -1
      else if (y.bucketName > x.bucketName) 1
      else 0
    }
  }

  object PolicyDiffEntryOrdering extends Ordering[PolicyDiffEntry] {
    override def compare(x: PolicyDiffEntry, y: PolicyDiffEntry): Int = {
      if (x.role < y.role) -1
      else if (y.prefix > x.prefix) 1
      else 0
    }
  }
}
