/*
 * Copyright 2022 Google
 * This software is provided as-is, without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google.
 */

package com.google.cloud.pso.bqexternalviewgenerator.controller;


import com.google.cloud.pso.bqexternalviewgenerator.config.ViewGeneratorProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// This is a Dummy controller, this tool doesn't expose APIs at the moment
@RestController
@RequestMapping("/configs")
public class PropertiesController {

  @Autowired ViewGeneratorProperties configs;

  @GetMapping("/get")
  public ResponseEntity<String> getConfig() {
    return new ResponseEntity<>(configs.toString(), HttpStatus.OK);
  }
}
