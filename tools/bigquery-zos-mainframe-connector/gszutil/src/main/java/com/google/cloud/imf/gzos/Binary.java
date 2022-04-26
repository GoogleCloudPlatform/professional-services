/*
 * Copyright 2019 Google LLC All Rights Reserved.
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

package com.google.cloud.imf.gzos;

import java.nio.ByteBuffer;

public class Binary {
    /** Decodes a long from a ByteBuffer
     *
     * Picture	Storage representation	Numeric values
     * S9(1)  to S9(4) COMP.  Binary halfword (2 bytes)
     *   -32768
     *   +32767
     * S9(5)  to S9(9) COMP.  Binary fullword (4 bytes)
     *   -2,147,483,648
     *   +2,147,483,647
     * S9(10) to S9(18) COMP. Binary doubleword (8 bytes)
     *   -9,223,372,036,854,775,808
     *   +9,223,372,036,854,775,807
     * @param buf ByteBuffer containing an encoded long
     * @param size number of bytes to decode
     * @return
     */
    public static long decode(ByteBuffer buf, int size) {
        long scratchLong = 0;
        int i = 0;
        byte b = buf.get(buf.position());
        boolean isNegative = (b & 0x80) == 0x80;

        if (isNegative) {
            while (i < size){
                b = buf.get();
                scratchLong <<= 8;
                scratchLong |= (~b & 0xFF);
                i++;
            }
            scratchLong *= -1;
            scratchLong -= 1;
        } else {
            while (i < size){
                b = buf.get();
                scratchLong <<= 8;
                scratchLong |= (b & 0xFF);
                i++;
            }
        }
        return scratchLong;
    }

    /** Decodes an unsigned long from a ByteBuffer
     *
     * Picture	Storage representation	Numeric values
     * 9(1) to 9(4)	    Binary halfword (2 bytes)	0 through 65535
     * 9(5) to 9(9)	    Binary fullword (4 bytes)	0 through 4,294,967,295
     * 9(10) to 9(18)	Binary doubleword (8 bytes)	0 through 18,446,744,073,709,551,615
     *
     * @param buf ByteBuffer containing an encoded unsigned long
     * @param size number of bytes to decode
     * @return
     */
    public static long decodeUnsigned(ByteBuffer buf, int size) {
        long scratchLong = 0;
        int i = 0;
        byte b;
        while (i < size){
            b = buf.get();
            scratchLong <<= 8;
            scratchLong |= (b & 0xFF);
            i++;
        }
        return scratchLong;
    }

    public static byte[] encode(int x, int size) {
        return encode(x, size, new byte[size], 0);
    }

    public static byte[] encode(int x, int size, byte[] buf, int off) {
        // TODO support negative values
        int k = x;
        for (int i = size-1; i >= 0; i--){
            buf[off+i] = (byte)(k & 0xFF);
            k >>= 8;
        }
        return buf;
    }

    public static byte[] encode(long x, int size) {
        return encode(x, size, new byte[size], 0);
    }

    public static byte[] encode(long x, int size, byte[] buf, int off) {
        // TODO support negative values
        long k = x;
        for (int i = size-1; i >= 0; i--){
            buf[off+i] = (byte)(k & 0xFF);
            k >>= 8;
        }
        return buf;
    }
}
