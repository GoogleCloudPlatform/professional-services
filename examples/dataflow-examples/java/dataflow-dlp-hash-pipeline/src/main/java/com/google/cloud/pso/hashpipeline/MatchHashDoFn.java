/*
 * Copyright (C) 2020 Google Inc.
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

package com.google.cloud.pso.hashpipeline;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import java.io.IOException;
import java.util.List;
import java.util.concurrent.ExecutionException;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.DoFn.ProcessContext;
import org.apache.beam.sdk.transforms.DoFn.ProcessElement;
import org.apache.beam.sdk.transforms.DoFn.Setup;
import org.apache.beam.sdk.values.KV;
import org.mapdb.DB;
import org.mapdb.DBMaker;
import org.mapdb.HTreeMap.KeySet;
import org.mapdb.Serializer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class MatchHashDoFn extends DoFn<KV<String, String>, KV<String, String>> {
  private static final Logger log = LoggerFactory.getLogger(MatchHashDoFn.class);

  private String project;
  private String collectionName;
  private KeySet<String> hashes;
  private DB cache;
  private Firestore firestore;

  public MatchHashDoFn(String project, String collectionName) {
    this.project = project;
    this.collectionName = collectionName;
  }

  @Setup
  public void setup() throws InterruptedException, ExecutionException, IOException {
    try {
      FirebaseOptions options =
          new FirebaseOptions.Builder()
              .setCredentials(GoogleCredentials.getApplicationDefault())
              .setProjectId(this.project)
              .build();
      FirebaseApp.initializeApp(options);
    } catch (IllegalStateException e) {
      log.info("Firebase already initialized");
    } finally {
      // NOTE: Since this demo is scoped to SSNs, there are only
      // ever going to be 1 billion possible SSNs. Using SHA256, keys are
      // 32B each, and more likely the set will be less than 10M
      // records so it makes sense to cache the entire set into
      // an off-heap in-memory store like MapDB since it will be. If memory is a concern,
      // MapDB also gives an option of a local disk-based database as well.
      // We could further optimize this by making this DoFn stateful and
      // buffer findings to batch fetch from Firestore.
      DB cache = DBMaker.memoryDB().make();
      this.hashes = cache.hashSet("social_security_numbers", Serializer.STRING).createOrOpen();
      // NOTE: Since it is unlikely for this use case that we will want to remove
      // SSNs, we won't worry about expiring entries. Might be worth looking into
      // in the future if that end's up being a use case.
      this.firestore = FirestoreClient.getFirestore();
      List<QueryDocumentSnapshot> docs =
          firestore.collection(this.collectionName).get().get().getDocuments();
      for (QueryDocumentSnapshot doc : docs) {
        this.hashes.add(doc.getId());
      }
    }
  }

  @Teardown
  public void teardown() {
    this.cache.close();
  }

  @ProcessElement
  public void processElement(ProcessContext c) throws InterruptedException, ExecutionException {
    KV<String, String> entry = c.element();
    String hash = entry.getValue();
    if (this.hashes.contains(hash)) {
      c.output(entry);
      // log.info("Found SSN: " + hash);
    } else {
      DocumentSnapshot doc = this.firestore.document(this.collectionName + "/" + hash).get().get();
      if (doc.exists()) {
        this.hashes.add(hash);
        // log.info("Found SSN in remote: " + hash);
        c.output(entry);
      }
    }
  }
}
