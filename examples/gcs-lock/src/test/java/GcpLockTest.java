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

import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.util.concurrent.TimeUnit;

public class GcpLockTest {

    private static ByteArrayOutputStream bout;
    private static String LOCK_NAME = "lock";
    private static long timeout = 5;
    private static TimeUnit unit = TimeUnit.SECONDS;
    private static String bucketName = "my-test-bucket-nnene";

    @Before
    public void setUp() {
        bout = new ByteArrayOutputStream();
        PrintStream out = new PrintStream(bout);
        System.setOut(out);
    }

    @After
    public void tearDown() {
        System.setOut(null);
    }

    @Test
    public void testLock() {
        /**
         * Tests lock integrity. The method acquires one lock and then initiates another
         * request for a lock without unlocking the first. The second request should time out.
         */

        GcpLockFactory lockFactory = new GcpLockFactory(bucketName);

        Assert.assertThrows(RuntimeException.class, () -> {
            try (GcpLock gcpLock1 = lockFactory.createLock(LOCK_NAME, timeout, unit)) {
                TimeUnit.SECONDS.sleep(3); // Do work
                // Following requests for locking should be time out since resource is still locked
                try (GcpLock gcpLock2 = lockFactory.createLock(LOCK_NAME, timeout, unit)) {
                    TimeUnit.SECONDS.sleep(3); // Do work
                }
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        });

    }

    @Test
    public void testUnlock() {
        /**
         * Tests unlock/AutoClose. The method acquires one lock and releases it.
         */

        GcpLockFactory lockFactory = new GcpLockFactory(bucketName);

        try (GcpLock gcpLock1 = lockFactory.createLock(LOCK_NAME, timeout, unit)) {
            TimeUnit.SECONDS.sleep(2); // Do work
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        Assert.assertEquals("Lock acquired.\n" +
                "Job finished. Unlocked.\n", bout.toString());
    }

    @Test
    public void testTwoLocks() {
        /**
         * Tests creating two consecutive locks.
         */

        GcpLockFactory lockFactory = new GcpLockFactory(bucketName);

        try (GcpLock gcpLock1 = lockFactory.createLock(LOCK_NAME, timeout, unit)) {
            TimeUnit.SECONDS.sleep(2); // Do work
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        try (GcpLock gcpLock1 = lockFactory.createLock(LOCK_NAME, timeout, unit)) {
            TimeUnit.SECONDS.sleep(2); // Do work
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        Assert.assertEquals("Lock acquired.\n" +
                "Job finished. Unlocked.\n" +
                "Lock acquired.\n" +
                "Job finished. Unlocked.\n", bout.toString());
    }


}