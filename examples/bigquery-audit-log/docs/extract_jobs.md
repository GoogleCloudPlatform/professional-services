# Extract Jobs Report

This document outlines the Extract Jobs report (page 3) of the dashboard and explains the various graphs and tables present on the page.

#### Note: In all further sections, the "time", "week" or "day" is relative to the timeframe selected in the date filter in the Selection Bar at the top of the page

### Selection Bar
The Selection Bar allows the user to filter the data in the report to a specific date and/or table. There are filters present to filter by Project Id and Job Id as well.

![Selection Bar](../images/extract_jobs/Image1.png)

### Extracts By Day
The Bar Graph displays the total output of extract jobs carried over the past 7 days.

![Extracts By Day](../images/extract_jobs/Image2.png)

### Extracts By Table
The Bar Graph displays the number of extract jobs carried out over the past 7 days, color coded by the different **tables** the extract job was carried out on.

![Extracts By Table](../images/extract_jobs/Image3.png)

### Extracts By Project
The Bar Graph displays the number of extract jobs carried out over the past 7 days, color coded by the different **projects** the extract job was carried out on.

![Loads By Project](../images/extract_jobs/Image4.png)

### Table
The table displays the details pertaining to all the extract jobs carried out over the past 7 days.

![Table](../images/extract_jobs/Image5.png)

### User Id - Runtime Secs
The table displyas the average runtime (in seconds) for the extract jobs per user in the project (with access to BigQuery).

![User Id - Runtime Secs](../images/extract_jobs/Image6.png)

### Extracts By Hour
The pie chart displays the percentage of extract jobs carried out over the hours of the day.

**Example: Percentage of extract jobs carried out at 12 a.m. during the current week is 33.3%**


![Extracts By Hour](../images/extract_jobs/Image7.png)

### Extracts By Day of Week
The pie chart displays the percentage of extract jobs carried out over the days of the week.

![Extracts By Day of Week](../images/extract_jobs/Image8.png)
