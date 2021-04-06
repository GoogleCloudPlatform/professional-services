/*
Copyright 2021 Google LLC

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

public class Notification {

  // Cloud Functions uses GSON to populate this object.
  // Field types/names are specified by Cloud Functions
  // Changing them may break your code!
  private String metric;
  private Double limit;
  private Double usage;
  private Double consumption;
  private String emailIds;
  private String threshold;

  public String getMetric() {
    return metric;
  }

  public void setMetric(String metric) {
    this.metric = metric;
  }

  public Double getLimit() {
    return limit;
  }

  public void setLimit(Double limit) {
    this.limit = limit;
  }

  public Double getUsage() {
    return usage;
  }

  public void setUsage(Double usage) {
    this.usage = usage;
  }

  public Double getConsumption() {
    return consumption;
  }

  public void setConsumption(Double consumption) {
    this.consumption = consumption;
  }

  public String getEmailIds() {
    return emailIds;
  }

  public void setEmailIds(String emailIds) {
    this.emailIds = emailIds;
  }

  public String getThreshold() {
    return threshold;
  }

  public void setThreshold(String threshold) {
    this.threshold = threshold;
  }
}
