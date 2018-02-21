/*
 * Copyright 2017 Google Inc.
 * <p>
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * <p>
 * http://www.apache.org/licenses/LICENSE-2.0
 * <p>
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package translate.service;

import com.google.auth.Credentials;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.translate.Translate;
import com.google.cloud.translate.TranslateOptions;
import com.google.cloud.translate.Translation;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import org.springframework.stereotype.Service;

@Service
public class TranslateService {

  private final Credentials credentials;

  public TranslateService() throws Exception {

    File initialFile = new File(System.getenv("SA_CREDENTIALS"));
    InputStream targetStream = new FileInputStream(initialFile);
    credentials = GoogleCredentials.fromStream(targetStream);
  }

  public Translate createTranslateService(String targetLanguage) {

    return TranslateOptions.newBuilder()
        .setTargetLanguage(targetLanguage)
        .setCredentials(credentials)
        .build()
        .getService();
  }

  public String translateText(String sourceText, String targetLanguage) {
    Translate translate = createTranslateService(targetLanguage);
    Translation translation = translate.translate(sourceText);

    return translation.getTranslatedText();
  }
}
