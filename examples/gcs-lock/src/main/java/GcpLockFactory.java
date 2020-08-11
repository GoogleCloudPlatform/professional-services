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

import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;

import java.util.concurrent.TimeUnit;

public class GcpLockFactory {
    private final String bucketName;
    private final Storage storage = StorageOptions.getDefaultInstance().getService();

    public GcpLockFactory(String bucket) {
        this.bucketName = bucket;
    }

    public GcpLock createLock(String blob, long timeout, TimeUnit unit) throws InterruptedException {
        /**
         * Method to create lock.
         * @param blob name of lock file
         * @param timeout Time to wait to acquire a lock
         * @param unit TimeUnit of timeout
         */
        return new GcpLock(storage, bucketName, blob, timeout, unit);
    }
}