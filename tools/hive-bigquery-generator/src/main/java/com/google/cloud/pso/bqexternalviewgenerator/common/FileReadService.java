/*
 * Copyright 2022 Google
 * This software is provided as-is, without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google.
 */

package com.google.cloud.pso.bqexternalviewgenerator.common;


import java.io.FileReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;

public class FileReadService {

  public static List<String> loadAsList(String filePath) throws IOException {
    return Files.readAllLines(Paths.get(filePath), StandardCharsets.UTF_8);
  }

  public static String loadAsString(String filePath) throws IOException {
    return new String(Files.readAllBytes(Paths.get(filePath)));
  }

  public static FileReader readCursor(String filePath) throws IOException {
    return new FileReader(filePath);
  }
}
