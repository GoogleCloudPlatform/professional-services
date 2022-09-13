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


import scala.NotImplementedError;

public abstract class RecordWriter implements ZFileConstants {
    protected boolean autoFree;

    protected RecordWriter() {}

    public static RecordWriter newWriterForDD(String ddname) throws ZFileException {
        throw new NotImplementedError();
    }

    static RecordWriter basicNewWriterForDD(String ddname) throws ZFileException {
        throw new NotImplementedError();
    }

    public static RecordWriter newWriter(String name, int flags) throws ZFileException, RcException {
        throw new NotImplementedError();
    }

    public abstract void write(byte[] var1) throws ZFileException;

    public abstract void write(byte[] var1, int var2, int var3) throws ZFileException;

    public abstract void close() throws ZFileException;

    public abstract void flush() throws ZFileException;

    public abstract int getLrecl();

    public abstract int getBlksize();

    public abstract int getRecfmBits();

    public abstract String getRecfm();

    public abstract String getDDName();

    public abstract String getDsn();

    public boolean getAutoFree() {
        throw new NotImplementedError();
    }

    public void setAutoFree(boolean autoFree) {
        throw new NotImplementedError();
    }

    protected static String doAlloc(String fqdsn, String disp) throws RcException {
        throw new NotImplementedError();
    }

    protected static void doFree(String ddname) {
        throw new NotImplementedError();
    }

    protected void doAutoFree() {
        throw new NotImplementedError();
    }

    private static String extractDDName(String filename) {
        throw new NotImplementedError();
    }
}
