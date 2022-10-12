/*
 * Copyright 2022 Google
 * This software is provided as-is, without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google.
 */

package com.google.cloud.pso.bqexternalviewgenerator.common;


import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

public class FileWriteService {
  FileWriter fileWriter;

  public FileWriteService(String filePath) throws IOException {
    Files.createDirectories(Paths.get(filePath).getParent());
    File file = new File(filePath);
    file.createNewFile(); // if file already exists will do nothing
    this.fileWriter = new FileWriter(file);
  }

  public void store(String fileContent) throws IOException {
    fileWriter.write(fileContent);
  }

  public void closeFile() {
    try {
      fileWriter.close();
    } catch (Exception ex) {
      ex.printStackTrace();
    }
  }
}
