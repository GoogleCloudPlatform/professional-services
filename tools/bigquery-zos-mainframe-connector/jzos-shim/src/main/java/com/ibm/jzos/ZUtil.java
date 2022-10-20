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

import java.util.Properties;

public class ZUtil {
    public static void peekOSMemory(long address, byte[] bytes) throws RcException {
        throw new RuntimeException("not implemented");
    }
    public static long peekOSMemory(long address, int len) throws RcException {
        throw new RuntimeException("not implemented");
    }

    public static String getCurrentJobId() {
        throw new RuntimeException("not implemented");
    }

    public static String getCurrentJobname() {
        throw new RuntimeException("not implemented");
    }

    public static String getCurrentStepname() {
        throw new RuntimeException("not implemented");
    }

    public static String getCurrentProcStepname() {
        throw new RuntimeException("not implemented");
    }

    public static String getCurrentUser() throws RcException {
        throw new RuntimeException("not implemented");
    }

    public static String substituteSystemSymbols(String pattern) throws RcException {
        throw new RuntimeException("not implemented");
    }

    public static String getDefaultPlatformEncoding() {
        throw new RuntimeException("not implemented");
    }

    public static Properties getEnvironment() {
        throw new RuntimeException("not implemented");
    }
}
