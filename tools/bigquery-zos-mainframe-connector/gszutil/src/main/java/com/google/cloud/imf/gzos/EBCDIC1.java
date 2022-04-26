package com.google.cloud.imf.gzos;

import com.google.cloud.imf.util.Bits;
import com.google.common.io.Resources;

import java.io.IOException;
import java.nio.BufferOverflowException;
import java.nio.BufferUnderflowException;
import java.nio.ByteBuffer;
import java.nio.CharBuffer;
import java.nio.charset.*;

/** IBM1047 / CP1047 with 0xBA,0xBB '\u009A','\u009B' replaced with '[',']' (91,93) */
public class EBCDIC1 extends Charset {
    public EBCDIC1() {
        super("EBCDIC", new String[]{"IBM1047","CP1047"});
    }

    private static final char[] b2c = new char[256];
    private static final byte[] c2b = new byte[256];

    public boolean contains(Charset cs) { return cs instanceof EBCDIC1; }

    public CharsetDecoder newDecoder() {
        return new EBCDICDecoder(this);
    }

    public static class EBCDICDecoder extends CharsetDecoder {
        public EBCDICDecoder(Charset cs){
            super(cs, 1, 1);
        }

        @Override
        protected CoderResult decodeLoop(ByteBuffer in, CharBuffer out) {
            try {
                while (true) {
                    out.put(b2c[Bits.uint(in.get())]);
                }
            } catch (BufferUnderflowException e) {
                return CoderResult.UNDERFLOW;
            } catch (BufferOverflowException e) {
                return CoderResult.OVERFLOW;
            }
        }
    }

    public CharsetEncoder newEncoder() {
        return new EBCDICEncoder(this);
    }

    public static class EBCDICEncoder extends CharsetEncoder {
        public EBCDICEncoder(Charset cs){
            super(cs, 1, 1);
        }

        @Override
        protected CoderResult encodeLoop(CharBuffer in, ByteBuffer out) {
            try {
                while (true) {
                    int i = in.get();
                    if (i >= c2b.length) {
                        throw new IllegalStateException("Could not encode character '" + (char) i + "' with encoding " + this.charset().aliases() + " !!!");
                    }
                    out.put(c2b[i]);
                }
            } catch (BufferUnderflowException e) {
                return CoderResult.UNDERFLOW;
            } catch (BufferOverflowException e) {
                return CoderResult.OVERFLOW;
            }
        }
    }

    static {
        try {
            byte[] bytes = Resources.toByteArray(Resources.getResource("ebcdic.dat"));
            assert(bytes.length == 256);
            char[] chars = Resources.toString(Resources.getResource("ebcdic.txt"),
                StandardCharsets.UTF_8).toCharArray();
            assert(chars.length == 256);
            System.arraycopy(chars, 0, b2c, 0, 256);

            for (int i = 0; i < 256; i++){
                c2b[chars[i]] = bytes[i];
            }
        } catch (IOException e){
            throw new RuntimeException(e);
        }
    }
}
