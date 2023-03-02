package com.google.cloud.imf.util

import com.google.api.gax.paging.Page
import com.google.cloud.{Policy, ReadChannel, WriteChannel}
import com.google.cloud.storage.{Acl, Blob, BlobId, BlobInfo, Bucket, BucketInfo, CopyWriter, HmacKey, Notification, NotificationInfo, PostPolicyV4, ServiceAccount, Storage, StorageBatch, StorageOptions}

import java.io.{InputStream, OutputStream}
import java.net.URL
import java.nio.file.Path
import java.{lang, util}
import java.util.concurrent.TimeUnit

class StorageWithRetries(storage: Storage, override val retriesCount: Int, override val retriesTimeoutMillis: Int) extends Storage with GoogleApiL2Retrier {

  override def get(blob: BlobId): Blob = runWithRetry(storage.get(blob), "Storage.get()")

  override def get(blob: BlobId, options: Storage.BlobGetOption*): Blob = runWithRetry(storage.get(blob, options: _*), "Storage.get()")

  override def get(bucket: String, options: Storage.BucketGetOption*): Bucket = runWithRetry(storage.get(bucket, options: _*), "Storage.get()")

  override def get(bucket: String, blob: String, options: Storage.BlobGetOption*): Blob = runWithRetry(storage.get(bucket, blob, options: _*), "Storage.get()")

  override def get(blobIds: BlobId*): util.List[Blob] = runWithRetry(storage.get(blobIds: _*), "Storage.get()")

  override def get(blobIds: lang.Iterable[BlobId]): util.List[Blob] = runWithRetry(storage.get(blobIds), "Storage.get()")

  override def list(bucket: String, options: Storage.BlobListOption*): Page[Blob] = runWithRetry(storage.list(bucket, options: _*), "Storage.list()")

  override def list(options: Storage.BucketListOption*): Page[Bucket] = runWithRetry(storage.list(options: _*), "Storage.list()")

  override def compose(composeRequest: Storage.ComposeRequest): Blob = runWithRetry(storage.compose(composeRequest), "Storage.compose()")

  //no retries
  override def create(bucketInfo: BucketInfo, options: Storage.BucketTargetOption*): Bucket = storage.create(bucketInfo, options: _*)

  override def create(blobInfo: BlobInfo, options: Storage.BlobTargetOption*): Blob = storage.create(blobInfo, options: _*)

  override def create(blobInfo: BlobInfo, content: Array[Byte], options: Storage.BlobTargetOption*): Blob = storage.create(blobInfo, content, options: _*)

  override def create(blobInfo: BlobInfo, content: Array[Byte], offset: Int, length: Int, options: Storage.BlobTargetOption*): Blob = storage.create(blobInfo, content, offset, length, options: _*)

  @deprecated
  override def create(blobInfo: BlobInfo, content: InputStream, options: Storage.BlobWriteOption*): Blob = storage.create(blobInfo, content, options: _*)

  override def createFrom(blobInfo: BlobInfo, path: Path, options: Storage.BlobWriteOption*): Blob = storage.createFrom(blobInfo, path, options: _*)

  override def createFrom(blobInfo: BlobInfo, path: Path, bufferSize: Int, options: Storage.BlobWriteOption*): Blob = storage.createFrom(blobInfo, path, bufferSize, options: _*)

  override def createFrom(blobInfo: BlobInfo, content: InputStream, options: Storage.BlobWriteOption*): Blob = storage.createFrom(blobInfo, content, options: _*)

  override def createFrom(blobInfo: BlobInfo, content: InputStream, bufferSize: Int, options: Storage.BlobWriteOption*): Blob = storage.createFrom(blobInfo, content, bufferSize, options: _*)

  override def lockRetentionPolicy(bucket: BucketInfo, options: Storage.BucketTargetOption*): Bucket = storage.lockRetentionPolicy(bucket, options: _*)

  override def update(bucketInfo: BucketInfo, options: Storage.BucketTargetOption*): Bucket = storage.update(bucketInfo, options: _*)

  override def update(blobInfo: BlobInfo, options: Storage.BlobTargetOption*): Blob = storage.update(blobInfo, options: _*)

  override def update(blobInfo: BlobInfo): Blob = storage.update(blobInfo)

  override def delete(bucket: String, options: Storage.BucketSourceOption*): Boolean = storage.delete(bucket, options: _*)

  override def delete(bucket: String, blob: String, options: Storage.BlobSourceOption*): Boolean = storage.delete(bucket, blob, options: _*)

  override def delete(blob: BlobId, options: Storage.BlobSourceOption*): Boolean = storage.delete(blob, options: _*)

  override def delete(blob: BlobId): Boolean = storage.delete(blob)

  override def copy(copyRequest: Storage.CopyRequest): CopyWriter = storage.copy(copyRequest)

  override def readAllBytes(bucket: String, blob: String, options: Storage.BlobSourceOption*): Array[Byte] = storage.readAllBytes(bucket, blob, options: _*)

  override def readAllBytes(blob: BlobId, options: Storage.BlobSourceOption*): Array[Byte] = storage.readAllBytes(blob, options: _*)

  override def batch(): StorageBatch = storage.batch()

  override def reader(bucket: String, blob: String, options: Storage.BlobSourceOption*): ReadChannel = storage.reader(bucket, blob, options: _*)

  override def reader(blob: BlobId, options: Storage.BlobSourceOption*): ReadChannel = storage.reader(blob, options: _*)

  override def writer(blobInfo: BlobInfo, options: Storage.BlobWriteOption*): WriteChannel = storage.writer(blobInfo, options: _*)

  override def writer(signedURL: URL): WriteChannel = storage.writer(signedURL)

  override def signUrl(blobInfo: BlobInfo, duration: Long, unit: TimeUnit, options: Storage.SignUrlOption*): URL = storage.signUrl(blobInfo, duration, unit, options: _*)

  override def generateSignedPostPolicyV4(blobInfo: BlobInfo, duration: Long, unit: TimeUnit, fields: PostPolicyV4.PostFieldsV4, conditions: PostPolicyV4.PostConditionsV4, options: Storage.PostPolicyV4Option*): PostPolicyV4 = storage.generateSignedPostPolicyV4(blobInfo, duration, unit, fields, conditions, options: _*)

  override def generateSignedPostPolicyV4(blobInfo: BlobInfo, duration: Long, unit: TimeUnit, fields: PostPolicyV4.PostFieldsV4, options: Storage.PostPolicyV4Option*): PostPolicyV4 = storage.generateSignedPostPolicyV4(blobInfo, duration, unit, fields, options: _*)

  override def generateSignedPostPolicyV4(blobInfo: BlobInfo, duration: Long, unit: TimeUnit, conditions: PostPolicyV4.PostConditionsV4, options: Storage.PostPolicyV4Option*): PostPolicyV4 = storage.generateSignedPostPolicyV4(blobInfo, duration, unit, conditions, options: _*)

  override def generateSignedPostPolicyV4(blobInfo: BlobInfo, duration: Long, unit: TimeUnit, options: Storage.PostPolicyV4Option*): PostPolicyV4 = storage.generateSignedPostPolicyV4(blobInfo, duration, unit, options: _*)

  override def update(blobInfos: BlobInfo*): util.List[Blob] = storage.update(blobInfos: _*)

  override def update(blobInfos: lang.Iterable[BlobInfo]): util.List[Blob] = storage.update(blobInfos)

  override def delete(blobIds: BlobId*): util.List[lang.Boolean] = storage.delete(blobIds: _*)

  override def delete(blobIds: lang.Iterable[BlobId]): util.List[lang.Boolean] = storage.delete(blobIds)

  override def getAcl(bucket: String, entity: Acl.Entity, options: Storage.BucketSourceOption*): Acl = storage.getAcl(bucket, entity, options: _*)

  override def getAcl(bucket: String, entity: Acl.Entity): Acl = storage.getAcl(bucket, entity)

  override def deleteAcl(bucket: String, entity: Acl.Entity, options: Storage.BucketSourceOption*): Boolean = storage.deleteAcl(bucket, entity, options: _*)

  override def deleteAcl(bucket: String, entity: Acl.Entity): Boolean = storage.deleteAcl(bucket, entity)

  override def createAcl(bucket: String, acl: Acl, options: Storage.BucketSourceOption*): Acl = storage.createAcl(bucket, acl, options: _*)

  override def createAcl(bucket: String, acl: Acl): Acl = storage.createAcl(bucket, acl)

  override def updateAcl(bucket: String, acl: Acl, options: Storage.BucketSourceOption*): Acl = storage.updateAcl(bucket, acl, options: _*)

  override def updateAcl(bucket: String, acl: Acl): Acl = storage.updateAcl(bucket, acl)

  override def listAcls(bucket: String, options: Storage.BucketSourceOption*): util.List[Acl] = storage.listAcls(bucket, options: _*)

  override def listAcls(bucket: String): util.List[Acl] = storage.listAcls(bucket)

  override def getDefaultAcl(bucket: String, entity: Acl.Entity): Acl = storage.getDefaultAcl(bucket, entity)

  override def deleteDefaultAcl(bucket: String, entity: Acl.Entity): Boolean = storage.deleteDefaultAcl(bucket, entity)

  override def createDefaultAcl(bucket: String, acl: Acl): Acl = storage.createDefaultAcl(bucket, acl)

  override def updateDefaultAcl(bucket: String, acl: Acl): Acl = storage.updateDefaultAcl(bucket, acl)

  override def listDefaultAcls(bucket: String): util.List[Acl] = storage.listDefaultAcls(bucket)

  override def getAcl(blob: BlobId, entity: Acl.Entity): Acl = storage.getAcl(blob, entity)

  override def deleteAcl(blob: BlobId, entity: Acl.Entity): Boolean = storage.deleteAcl(blob, entity)

  override def createAcl(blob: BlobId, acl: Acl): Acl = storage.createAcl(blob, acl)

  override def updateAcl(blob: BlobId, acl: Acl): Acl = storage.updateAcl(blob, acl)

  override def listAcls(blob: BlobId): util.List[Acl] = storage.listAcls(blob)

  override def createHmacKey(serviceAccount: ServiceAccount, options: Storage.CreateHmacKeyOption*): HmacKey = storage.createHmacKey(serviceAccount, options: _*)

  override def listHmacKeys(options: Storage.ListHmacKeysOption*): Page[HmacKey.HmacKeyMetadata] = storage.listHmacKeys(options: _*)

  override def getHmacKey(accessId: String, options: Storage.GetHmacKeyOption*): HmacKey.HmacKeyMetadata = storage.getHmacKey(accessId, options: _*)

  override def deleteHmacKey(hmacKeyMetadata: HmacKey.HmacKeyMetadata, options: Storage.DeleteHmacKeyOption*): Unit = storage.deleteHmacKey(hmacKeyMetadata, options: _*)

  override def updateHmacKeyState(hmacKeyMetadata: HmacKey.HmacKeyMetadata, state: HmacKey.HmacKeyState, options: Storage.UpdateHmacKeyOption*): HmacKey.HmacKeyMetadata = storage.updateHmacKeyState(hmacKeyMetadata, state, options: _*)

  override def getIamPolicy(bucket: String, options: Storage.BucketSourceOption*): Policy = storage.getIamPolicy(bucket, options: _*)

  override def setIamPolicy(bucket: String, policy: Policy, options: Storage.BucketSourceOption*): Policy = storage.setIamPolicy(bucket, policy, options: _*)

  override def testIamPermissions(bucket: String, permissions: util.List[String], options: Storage.BucketSourceOption*): util.List[lang.Boolean] = storage.testIamPermissions(bucket, permissions, options: _*)

  override def getServiceAccount(projectId: String): ServiceAccount = storage.getServiceAccount(projectId)

  override def getOptions: StorageOptions = storage.getOptions

  override def downloadTo(blob: BlobId, path: Path, options: Storage.BlobSourceOption*): Unit =
    storage.downloadTo(blob,path,options:_*)

  override def downloadTo(blob: BlobId, outputStream: OutputStream, options: Storage.BlobSourceOption*): Unit =
    storage.downloadTo(blob, outputStream, options:_*)

  override def createNotification(bucket: String, notificationInfo: NotificationInfo): Notification =
    storage.createNotification(bucket, notificationInfo)

  override def getNotification(bucket: String, notificationId: String): Notification =
    storage.getNotification(bucket, notificationId)

  override def listNotifications(bucket: String): util.List[Notification] =
    storage.listNotifications(bucket)

  override def deleteNotification(bucket: String, notificationId: String): Boolean =
    storage.deleteNotification(bucket, notificationId)
}
