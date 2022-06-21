/*
Copyright 2022 Google LLC

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

package functions.eventpojos;

import java.util.Map;

public class PubSubMessage {
  // Cloud Functions uses GSON to populate this object.
  // Field types/names are specified by Cloud Functions
  // Changing them may break your code!
  private String data;
  private Map<String, String> attributes;
  private String messageId;
  private String publishTime;

  public String getData() {
    return data;
  }

  public void setData(String data) {
    this.data = data;
  }

  public Map<String, String> getAttributes() {
    return attributes;
  }

  public void setAttributes(Map<String, String> attributes) {
    this.attributes = attributes;
  }

  public String getMessageId() {
    return messageId;
  }

  public void setMessageId(String messageId) {
    this.messageId = messageId;
  }

  public String getPublishTime() {
    return publishTime;
  }

  public void setPublishTime(String publishTime) {
    this.publishTime = publishTime;
  }
}
// [END functions_helloworld_pubsub_message]
