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

public class PubSubMessage {
  // Cloud Functions uses GSON to populate this object.
  // Field types/names are specified by Cloud Functions
  // Changing them may break your code!
  private String metric;
  private String limit;
  private String usage;
  private Float consumption;
  private String emailIds;

  public String getMetric() {
    return metric;
  }

  public void setMetric(String metric) {
    this.metric = metric;
  }

  public String getLimit() {
    return limit;
  }

  public void setLimit(String limit) {
    this.limit = limit;
  }

  public String getUsage() {
    return usage;
  }

  public void setUsage(String usage) {
    this.usage = usage;
  }

  public Float getConsumption() {
    return consumption;
  }

  public void setConsumption(Float consumption) {
    this.consumption = consumption;
  }

  public String getEmailIds() {
    return emailIds;
  }

  public void setEmailIds(String emailIds) {
    this.emailIds = emailIds;
  }
}
