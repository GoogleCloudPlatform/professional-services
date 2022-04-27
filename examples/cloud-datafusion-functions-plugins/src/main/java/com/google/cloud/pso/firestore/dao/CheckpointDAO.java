/*
 * Copyright 2021 Google LLC
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
package com.google.cloud.pso.firestore.dao;

import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.FirestoreOptions;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.Query.Direction;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;
import com.google.cloud.pso.common.GCPUtils;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

/** DAO to read and update checkpoints in Firestore. */
public class CheckpointDAO {

  private String serviceAccountFilePath;
  private String project;

  public CheckpointDAO(String serviceAccountFilePath, String project) {
    this.serviceAccountFilePath = serviceAccountFilePath;
    this.project = project;
  }

  private Firestore getFirestore() throws IOException {

    FirestoreOptions.Builder firestoreBuilder = FirestoreOptions.newBuilder();
    if (serviceAccountFilePath != null) {
      firestoreBuilder.setCredentials(
          GCPUtils.loadServiceAccountCredentials(serviceAccountFilePath));
    }
    if (project != null) {
      firestoreBuilder.setProjectId(project);
    }
    return firestoreBuilder.build().getService();
  }

  public void appendCheckpoint(String collectionName, String documentName, String watermarkValue)
      throws IOException, ExecutionException, InterruptedException, Exception {
    Map<String, Object> checkpoint = new HashMap<String, Object>();
    checkpoint.put("CHECKPOINT_VALUE", watermarkValue);
    Timestamp timestamp = Timestamp.now();
    checkpoint.put("CREATED_TIMESTAMP", timestamp);
    Firestore db = null;
    try {
      db = getFirestore();
      DocumentReference docRef = db.collection(collectionName).document(documentName.toUpperCase());
      DocumentReference subCollectionRef =
          docRef.collection("CHECKPOINT").document(getCurrentDateTime());
      ApiFuture<WriteResult> result = subCollectionRef.set(checkpoint);
      result.get().getUpdateTime();
    } finally {
      if (db != null) {
        // db.close() throws java.lang.Exception
        db.close();
      }
    }
  }

  private String getCurrentDateTime() {
    String pattern = "yyyy-MM-dd-HH:mm:ss";
    SimpleDateFormat simpleDateFormat = new SimpleDateFormat(pattern);

    String date = simpleDateFormat.format(new Date());
    return date;
  }

  public String getLatestCheckpointValue(String collectionName, String documentName)
      throws IOException, ExecutionException, InterruptedException, Exception {
    String latestWatermarkValue = null;
    Firestore db = null;
    try {
      db = getFirestore();
      Query query =
          db.collection(collectionName + "/" + documentName + "/CHECKPOINT")
              .orderBy("CREATED_TIMESTAMP", Direction.DESCENDING)
              .limit(1)
              .get()
              .get()
              .getQuery();
      QuerySnapshot snap = query.get().get();
      List<QueryDocumentSnapshot> docs = snap.getDocuments();

      for (QueryDocumentSnapshot docSnap : docs) {
        latestWatermarkValue = docSnap.getString("CHECKPOINT_VALUE");
      }
    } finally {
      if (db != null) {
        // db.close() throws java.lang.Exception
        db.close();
      }
    }
    return latestWatermarkValue;
  }
}
