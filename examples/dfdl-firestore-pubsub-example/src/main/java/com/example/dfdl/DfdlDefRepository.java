package com.example.dfdl;

import com.google.cloud.spring.data.firestore.FirestoreReactiveRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DfdlDefRepository extends FirestoreReactiveRepository<DfdlDef> { }