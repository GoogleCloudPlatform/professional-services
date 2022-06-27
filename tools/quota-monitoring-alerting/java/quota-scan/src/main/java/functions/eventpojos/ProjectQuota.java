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

/*
 * POJO for ProjectQuota
 * */
public class ProjectQuota {
  private Integer threshold;
  private String region;
  private String metricValue;
  private String metricValueType;
  private String vpcName;
  private String metric;
  private String timestamp;
  private String projectId;
  private String folderId;
  private String value;
  private String targetPoolName;
  private String orgId;

  public Integer getThreshold() {
    return threshold;
  }

  public void setThreshold(Integer threshold) {
    this.threshold = threshold;
  }

  public String getRegion() {
    return region;
  }

  public void setRegion(String region) {
    this.region = region;
  }

  public String getMetricValue() {
    return metricValue;
  }

  public void setMetricValue(String metricValue) {
    this.metricValue = metricValue;
  }

  public String getMetricValueType() {
    return metricValueType;
  }

  public void setMetricValueType(String metricValueType) {
    this.metricValueType = metricValueType;
  }

  public String getVpcName() {
    return vpcName;
  }

  public void setVpcName(String vpcName) {
    this.vpcName = vpcName;
  }

  public String getMetric() {
    return metric;
  }

  public void setMetric(String metric) {
    this.metric = metric;
  }

  public String getTimestamp() {
    return timestamp;
  }

  public void setTimestamp(String timestamp) {
    this.timestamp = timestamp;
  }

  public String getProjectId() {
    return projectId;
  }

  public void setProjectId(String projectId) {
    this.projectId = projectId;
  }

  public String getFolderId() {
    return folderId;
  }

  public void setFolderId(String folderId) {
    this.folderId = folderId;
  }

  public String getValue() {
    return value;
  }

  public void setValue(String value) {
    this.value = value;
  }

  public String getTargetPoolName() {
    return targetPoolName;
  }

  public void setTargetPoolName(String targetPoolName) {
    this.targetPoolName = targetPoolName;
  }

  public String getOrgId() {
    return orgId;
  }

  public void setOrgId(String orgId) {
    this.orgId = orgId;
  }
}
