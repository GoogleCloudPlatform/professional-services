package com.google.cloud.imf.gzos;

public class Bytes {

    /** Prints a byte as Binary. Used for debugging.
     *
     * @param b byte
     * @return String of 0 and 1 representing byte b
     */
    public static String binValue(byte b) {
        StringBuilder sb = new StringBuilder(8);
        for (int i = 0; i < 8; i++) {
            if ((b & 0x01) == 0x01) {
                sb.append('1');
            } else {
                sb.append('0');
            }
            b >>>= 1;
        }
        return sb.reverse().toString();
    }

    /** Prints a byte array as Binary. Used for debugging.
     *
     * @param bytes byte[]
     * @return String of 0's and 1s representing byte[] bytes
     */
    public static String binValue(byte[] bytes) {
        StringBuilder sb = new StringBuilder(8*bytes.length);
        for (int j = 0; j< bytes.length; j++){
            sb.append(binValue(bytes[j]));
        }
        return sb.toString();
    }

    private static final String[] hexValues = new String[256];
    private static final char[] hex = "0123456789ABCDEF".toCharArray();

    static {
        for (int i = 0; i < 256; i++) {
            hexValues[i] = String.valueOf(new char[]{
                    hex[i >>> 4],
                    hex[i & 0xF]
            });
        }
    }

    private static int uint(byte b) {
        if (b < 0) return 256 + b;
        else return b;
    }

    private static String hexValue(byte b) {
        return hexValues[uint(b)];
    }

    public static String hexValue(byte[] bytes) {
        StringBuilder sb1 = new StringBuilder(bytes.length * 2);
        StringBuilder sb2 = new StringBuilder(bytes.length * 2);
        for (int i = 0; i < bytes.length; i++){
            sb1.append(hexValue(bytes[i]).charAt(0));
            sb2.append(hexValue(bytes[i]).charAt(1));
        }
        return sb1.toString() + "\n" + sb2.toString();
    }
}
