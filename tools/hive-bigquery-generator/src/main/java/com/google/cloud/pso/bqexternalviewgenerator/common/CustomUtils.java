/*
 * Copyright 2022 Google
 * This software is provided as-is, without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google.
 */

package com.google.cloud.pso.bqexternalviewgenerator.common;


import java.nio.CharBuffer;

public class CustomUtils {
  // Indents Input String and adds n spaces at start of every new line in input string
  public static String indent(String s, int n) {
    return s.replaceAll("(?m)^", CharBuffer.allocate(n).toString().replace('\0', ' '));
  }
}
