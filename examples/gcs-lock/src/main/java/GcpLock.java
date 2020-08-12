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

import com.google.api.client.util.*;
import com.google.cloud.storage.*;
import java.io.IOException;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class GcpLock implements AutoCloseable {

  final Logger logger = LoggerFactory.getLogger(GcpLock.class);
  private final ExponentialBackOff backOff;
  private final String bucketName;
  private final String blobName;
  private final Storage storage;
  private int timeout;

  /**
   * Default constructor to initialize lock.
   *
   * @param storage Storage interface for Google Cloud Storage
   * @param bucket Name of the bucket where the lock file will be written
   * @param blob Name of lock object
   * @param time Number of seconds to wait to acquire a lock
   * @param unit TimeUnit of timeout
   */
  public GcpLock(Storage storage, String bucket, String blob, long time, TimeUnit unit)
      throws InterruptedException {
    this.bucketName = bucket;
    this.blobName = blob;
    this.storage = storage;
    this.timeout = (int) TimeUnit.MILLISECONDS.convert(time, unit);
    this.backOff = new ExponentialBackOff.Builder().setMaxElapsedTimeMillis(timeout).build();
    lock();
  }

  /**
   * Method that waits indefinitely to acquire lock with timeout. Retries with exponential backoff.
   */
  public void lock() throws InterruptedException, RuntimeException {
    long startTime = System.nanoTime();
    while (true) {
      try {
        BlobId blobId = BlobId.of(bucketName, blobName);
        BlobInfo blobInfo = BlobInfo.newBuilder(blobId).setContentType("text/plain").build();
        Storage.BlobTargetOption blobOption = Storage.BlobTargetOption.doesNotExist();
        storage.create(blobInfo, blobOption);
        logger.debug("Lock acquired.");
        return;
      } catch (StorageException e) {
        // 412 Precondition Failed will indicate that the lock is already in use.
        long backOffMillis;
        try {
          backOffMillis = backOff.nextBackOffMillis();
        } catch (IOException backOffExp) {
          throw new RuntimeException("Error in exponential backoff: " + backOffExp);
        }
        if (e.getCode() != 412) {
          throw new RuntimeException("Error while locking: " + e);
        } else if (backOffMillis == BackOff.STOP) {
          throw new RuntimeException("Timed out while trying to acquire lock.");
        } else {
          logger.debug(
              "Retrying to acquire lock. Time elapsed: " + backOff.getElapsedTimeMillis() + "ms");
          TimeUnit.MILLISECONDS.sleep(backOffMillis);
        }
      }
    }
  }

  /** Method to release a lock implementing AutoClosable close(). */
  @Override
  public void close() throws RuntimeException {
    try {
      storage.delete(bucketName, blobName);
      logger.debug("Job finished. Unlocked.");
    } catch (StorageException e) {
      throw new RuntimeException("Error while unlocking: " + e);
    }
  }
}
