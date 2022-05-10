/*
 * Copyright 2022 Google LLC All Rights Reserved
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

package com.google.cloud.imf.util;

import java.io.OutputStream;
import java.io.PrintStream;
import java.io.UnsupportedEncodingException;

public class DualPrintStream extends PrintStream {
    private PrintStream ps1;

    public DualPrintStream(PrintStream ps, OutputStream os) throws UnsupportedEncodingException {
        super(os, false);
        this.ps1 = ps;
    }

    @Override
    public void write(int b) {
        ps1.write(b);
        super.write(b);
    }

    @Override
    public void write(byte[] buf, int off, int len) {
        ps1.write(buf, off, len);
        super.write(buf, off, len);
    }

    @Override
    public void println(String x) {
        ps1.println(x);
        super.println(x);
    }

    @Override
    public void close() {
        ps1.close();
        super.close();
    }

    @Override
    public void flush() {
        ps1.flush();
        super.flush();
    }
}
