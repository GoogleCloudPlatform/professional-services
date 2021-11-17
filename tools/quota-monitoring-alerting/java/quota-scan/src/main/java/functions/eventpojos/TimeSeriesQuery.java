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
