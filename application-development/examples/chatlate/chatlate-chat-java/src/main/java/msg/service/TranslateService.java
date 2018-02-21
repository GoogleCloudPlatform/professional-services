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

package msg.service;

import org.springframework.http.HttpEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class TranslateService {

  RestTemplate restTemplate = new RestTemplate();
  String url = System.getenv("TRANSLATE_URL");

  public String translateText(String sourceText, String targetLanguage) {
    HttpEntity<String> request = new HttpEntity<>(sourceText);
    HttpEntity<String> responseEntity =
        restTemplate.postForEntity(url + "translate/" + targetLanguage, request, String.class);
    return responseEntity.getBody();
  }
}
