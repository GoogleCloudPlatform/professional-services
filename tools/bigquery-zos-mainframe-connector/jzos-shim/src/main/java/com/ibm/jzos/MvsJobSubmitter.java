/*
 * Copyright 2022 Google LLC All Rights Reserved.
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

package com.ibm.jzos;

import java.io.IOException;

public class MvsJobSubmitter {
    public int getRdrLrecl() {
        throw new RuntimeException("not implemented");
    }

    public String getJobid() throws IOException {
        throw new RuntimeException("not implemented");
    }

    public void write(byte[] bytes) throws IOException {
        throw new RuntimeException("not implemented");
    }

    public void close() throws IOException {
        throw new RuntimeException("not implemented");
    }
}
