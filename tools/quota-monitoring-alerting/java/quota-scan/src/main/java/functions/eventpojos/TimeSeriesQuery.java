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

public class TimeSeriesQuery {
  private String allocationQuotaUsageFilter;
  private String rateQuotaUsageFilter;
  private String quotaLimitFilter;

  public String getAllocationQuotaUsageFilter() {
    return allocationQuotaUsageFilter;
  }

  public void setAllocationQuotaUsageFilter(String allocationQuotaUsageFilter) {
    this.allocationQuotaUsageFilter = allocationQuotaUsageFilter;
  }

  public String getRateQuotaUsageFilter() {
    return rateQuotaUsageFilter;
  }

  public void setRateQuotaUsageFilter(String rateQuotaUsageFilter) {
    this.rateQuotaUsageFilter = rateQuotaUsageFilter;
  }

  public String getQuotaLimitFilter() {
    return quotaLimitFilter;
  }

  public void setQuotaLimitFilter(String quotaLimitFilter) {
    this.quotaLimitFilter = quotaLimitFilter;
  }
}
