package com.example.dfdl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class FirestoreService {

  @Autowired
  private final DfdlDefRepository dfdlDefRepository;

  public FirestoreService(DfdlDefRepository dfdlDefRepository) {
    this.dfdlDefRepository = dfdlDefRepository;
  }

  public DfdlDef getDfdlDef(String name) {
    return dfdlDefRepository.findById(name).block();
  }
}