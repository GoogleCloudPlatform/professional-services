/*
 * Copyright 2020 Google LLC
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

import com.google.cloud.storage.*;
import java.util.concurrent.TimeUnit;

public class GcpLock implements AutoCloseable {

  private final String bucketName;
  private final String blobName;
  private final Storage storage;
  private long timeout;

  public GcpLock(Storage storage, String bucket, String blob, long time, TimeUnit unit)
      throws InterruptedException {
    /**
     * Default constructor to initialize lock.
     *
     * @param storage Storage interface for Google Cloud Storage
     * @param bucket Name of the bucket where the lock file will be written
     * @param blob Name of lock object
     * @param time Number of seconds to wait to acquire a lock
     * @param unit TimeUnit of timeout
     */
    this.bucketName = bucket;
    this.blobName = blob;
    this.storage = storage;
    this.timeout = TimeUnit.NANOSECONDS.convert(time, unit);
    lock();
  }

  public void lock() throws InterruptedException, RuntimeException {
    /**
     * Method that waits indefinitely to acquire lock with timeout. Retries with exponential
     * backoff.
     */
    long startTime = System.nanoTime();
    while (true) {
      try {
        BlobId blobId = BlobId.of(bucketName, blobName);
        BlobInfo blobInfo = BlobInfo.newBuilder(blobId).setContentType("text/plain").build();
        Storage.BlobTargetOption blobOption = Storage.BlobTargetOption.doesNotExist();
        storage.create(blobInfo, blobOption);
        System.out.println("Lock acquired.");
        return;
      } catch (StorageException e) {
        long elapsedTime = System.nanoTime() - startTime;
        // 412 Precondition Failed will indicate that the lock is already in use.
        if (e.getCode() != 412) {
          throw new RuntimeException("Error while locking: " + e);
        } else if (elapsedTime >= timeout) {
          throw new RuntimeException("Timed out while trying to acquire lock.");
        } else {
          System.out.println(
              "Retrying to acquire lock. Time elapsed: " + elapsedTime / 1000000000.0 + "s");
          TimeUnit.NANOSECONDS.sleep(elapsedTime *= 2);
        }
      }
    }
  }

  @Override
  public void close() throws RuntimeException {
    /** Method to release a lock implementing AutoClosable close(). */
    try {
      storage.delete(bucketName, "lock");
      System.out.println("Job finished. Unlocked.");
    } catch (StorageException e) {
      throw new RuntimeException("Error while unlocking: " + e);
    }
  }
}
