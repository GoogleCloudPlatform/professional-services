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

import java.io.ByteArrayOutputStream;
import java.util.concurrent.TimeUnit;
import org.junit.Assert;
import org.junit.Test;

public class GcpLockTest {

  private static ByteArrayOutputStream bout;
  private static String LOCK_NAME = "lock";
  private static long timeout = 5;
  private static TimeUnit unit = TimeUnit.SECONDS;
  private static String bucketName = "my-test-bucket-nnene";

  /**
   * Tests lock integrity. The method acquires one lock and then initiates another request for a
   * lock without unlocking the first. The second request should time out.
   */
  @Test
  public void testLock() throws InterruptedException {
    GcpLockFactory lockFactory = new GcpLockFactory(bucketName);

    Assert.assertThrows(
        RuntimeException.class,
        () -> {
          try (GcpLock gcpLock1 = lockFactory.createLock(LOCK_NAME, timeout, unit)) {
            // Do work here. Following requests for locking should be time out since resource is
            // still locked
            try (GcpLock gcpLock2 = lockFactory.createLock(LOCK_NAME, timeout, unit)) {
              // Code should never reach here since the lock cannot be released.
              Assert.fail("Acquired second claim on unreleased lock.");
            }
          }
        });
  }

  /** Tests unlock/AutoClose. The method acquires one lock and releases it. */
  @Test
  public void testUnlock() throws InterruptedException {
    GcpLockFactory lockFactory = new GcpLockFactory(bucketName);
    boolean lockAcquired = false;

    try (GcpLock gcpLock1 = lockFactory.createLock(LOCK_NAME, timeout, unit)) {
      lockAcquired = true;
    }

    Assert.assertTrue(lockAcquired);
  }

  /** Tests creating two consecutive locks. */
  @Test
  public void testTwoLocks() throws InterruptedException {
    GcpLockFactory lockFactory = new GcpLockFactory(bucketName);
    int locksAcquired = 0;

    try (GcpLock gcpLock1 = lockFactory.createLock(LOCK_NAME, timeout, unit)) {
      locksAcquired += 1;
    }

    try (GcpLock gcpLock1 = lockFactory.createLock(LOCK_NAME, timeout, unit)) {
      locksAcquired += 1;
    }

    Assert.assertEquals(locksAcquired, 2);
  }
}
