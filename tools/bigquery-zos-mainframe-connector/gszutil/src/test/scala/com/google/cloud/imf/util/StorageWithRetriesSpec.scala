package com.google.cloud.imf.util

import com.google.cloud.storage.Storage._
import com.google.cloud.storage.{BlobId, BlobInfo, Storage, StorageException}
import org.mockito.ArgumentMatchers.any
import org.mockito.internal.verification.Times
import org.mockito.{ArgumentMatchers, Mockito}
import org.scalatest.flatspec.AnyFlatSpec

import scala.jdk.CollectionConverters.SeqHasAsJava

class StorageWithRetriesSpec extends AnyFlatSpec {
  private val error = new StorageException(500, "internal error")

  it should "Crash and retry in Storage.get()" in {
    val storage = Mockito.mock(classOf[Storage])
    val dummyBlobId = BlobId.of("dummy", "dummy")
    Mockito.when(storage.get(ArgumentMatchers.any[BlobId]())).thenThrow(error)

    val storageWithRetries = new StorageWithRetries(storage, 1, 5)
    assertThrows[StorageException](storageWithRetries.get(dummyBlobId))
    Mockito.verify(storage, new Times(2)).get(dummyBlobId)
  }

  it should "Crash and retry in Storage.get() 2" in {
    val storage = Mockito.mock(classOf[Storage])
    val dummyBlobId = BlobId.of("dummy", "dummy")
    val option = Storage.BlobGetOption.userProject("dummy")
    Mockito.when(storage.get(ArgumentMatchers.any[BlobId](), ArgumentMatchers.any[BlobGetOption]())).thenThrow(error)

    val storageWithRetries = new StorageWithRetries(storage, 1, 5)
    assertThrows[StorageException](storageWithRetries.get(dummyBlobId, option))
    Mockito.verify(storage, new Times(2)).get(dummyBlobId, option)
  }

  it should "Crash and retry in Storage.get() 3" in {
    val storage = Mockito.mock(classOf[Storage])

    val bucketId = "dummyBucketId"
    val option = Storage.BucketGetOption.userProject("dummy")

    Mockito.when(storage.get(ArgumentMatchers.any[String](), ArgumentMatchers.any[BucketGetOption]())).thenThrow(error)

    val storageWithRetries = new StorageWithRetries(storage, 1, 5)
    assertThrows[StorageException](storageWithRetries.get(bucketId, option))
    Mockito.verify(storage, new Times(2)).get(bucketId, option)
  }

  it should "Crash and retry in Storage.get() 4" in {
    val storage = Mockito.mock(classOf[Storage])

    val bucketId = "dummyBucketId"
    val blobId = "dummyBlobId"
    val option = Storage.BlobGetOption.userProject("dummy")

    Mockito.when(storage.get(ArgumentMatchers.any[String](), ArgumentMatchers.any[String](), ArgumentMatchers.any[BlobGetOption]())).thenThrow(error)

    val storageWithRetries = new StorageWithRetries(storage, 1, 5)
    assertThrows[StorageException](storageWithRetries.get(bucketId, blobId, option))
    Mockito.verify(storage, new Times(2)).get(bucketId, blobId, option)
  }

  it should "Crash and retry in Storage.get() 5" in {
    val storage = Mockito.mock(classOf[Storage])
    val dummyBlobId = BlobId.of("dummy", "dummy")
    Mockito.when(storage.get(ArgumentMatchers.any[BlobId](), ArgumentMatchers.any[BlobId]())).thenThrow(error)

    val storageWithRetries = new StorageWithRetries(storage, 1, 5)
    assertThrows[StorageException](storageWithRetries.get(dummyBlobId, dummyBlobId))
    Mockito.verify(storage, new Times(2)).get(dummyBlobId, dummyBlobId)
  }

  it should "Crash and retry in Storage.get() 6" in {
    val storage = Mockito.mock(classOf[Storage])
    val blobIds = List[BlobId]().asJava
    Mockito.when(storage.get(any[java.lang.Iterable[BlobId]]())).thenThrow(error)

    val storageWithRetries = new StorageWithRetries(storage, 1, 5)
    assertThrows[StorageException](storageWithRetries.get(blobIds))
    Mockito.verify(storage, new Times(2)).get(blobIds)
  }

  it should "Crash and retry in Storage.list()" in {
    val storage = Mockito.mock(classOf[Storage])
    val bucketId = "dummy"
    val option = BlobListOption.userProject("dummy")
    Mockito.when(storage.list(bucketId, option)).thenThrow(error)

    val storageWithRetries = new StorageWithRetries(storage, 1, 5)
    assertThrows[StorageException](storageWithRetries.list(bucketId, option))
    Mockito.verify(storage, new Times(2)).list(bucketId, option)
  }

  it should "Crash and retry in Storage.list() 2" in {
    val storage = Mockito.mock(classOf[Storage])
    val option = BucketListOption.userProject("dummy")
    Mockito.when(storage.list(option)).thenThrow(error)

    val storageWithRetries = new StorageWithRetries(storage, 1, 5)
    assertThrows[StorageException](storageWithRetries.list(option))
    Mockito.verify(storage, new Times(2)).list(option)
  }

  //some negative cases
  it should "Crash and retry in Storage.compose() " in {
    val storage = Mockito.mock(classOf[Storage])
    val request = ComposeRequest.newBuilder()
      .addSource("dummy").setTarget(BlobInfo.newBuilder("dummy", "dummy").build()).build()
    Mockito.when(storage.compose(request)).thenThrow(error)

    val storageWithRetries = new StorageWithRetries(storage, 1, 5)
    assertThrows[StorageException](storageWithRetries.compose(request))
    Mockito.verify(storage, new Times(2)).compose(request)
  }

  it should "Should not retry and crash for Storage.create() " in {
    val storage = Mockito.mock(classOf[Storage])
    val blobInfo = BlobInfo.newBuilder("dummy", "dummy").build()
    Mockito.when(storage.create(blobInfo)).thenThrow(error)
    val storageWithRetries = new StorageWithRetries(storage, 5, 5)
    assertThrows[StorageException](storageWithRetries.create(blobInfo))
    Mockito.verify(storage, new Times(1)).create(blobInfo)
  }

  it should "Should not retry and crash for Storage.update() " in {
    val storage = Mockito.mock(classOf[Storage])
    val blobInfo = BlobInfo.newBuilder("dummy", "dummy").build()
    Mockito.when(storage.update(blobInfo)).thenThrow(error)

    val storageWithRetries = new StorageWithRetries(storage, 5, 5)
    assertThrows[StorageException](storageWithRetries.update(blobInfo))
    Mockito.verify(storage, new Times(1)).update(blobInfo)
  }

  it should "Should not retry and crash for Storage.delete() " in {
    val storage = Mockito.mock(classOf[Storage])
    val blobId = BlobId.of("dummy", "dummy")
    Mockito.when(storage.delete(blobId)).thenThrow(error)

    val storageWithRetries = new StorageWithRetries(storage, 5, 5)
    assertThrows[StorageException](storageWithRetries.delete(blobId))
    Mockito.verify(storage, new Times(1)).delete(blobId)
  }

}
