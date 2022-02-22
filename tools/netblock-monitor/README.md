# Google Netblock Monitor

Google maintains a global infrastructure, which grows dynamically to accommodate
increasing demand. Google services use a large range of IP addresses, which
often change.

As a result, there are some instances where G Suite customers will want to
monitor and know when changes are made to the list of IP addresses.

_Google Netblock Monitor_ provides a method that G Suite Administrators, Network
Admins, or Google Partners can follow in order to set up an automated Apps
Script project that will notify them via email when changes are made to Google’s
IP ranges.

Please see the
[Google Netblock Monitor article](https://www.cloudconnect.goog/docs/DOC-33011)
on Google Cloud Connect for more in-depth details and instructions.

## Requested Scopes

In order for the script to work, it must be initialized and granted necessary
permissions in order to take actions on behalf of the signed-in user. The
following scopes are required for the Netblock Monitor to function:

-   Gmail (https://mail.google.com)
-   Apps Script (https://www.googleapis.com/auth/script.external_request)
-   Apps Script (https://www.googleapis.com/auth/script.scriptapp)

## Configuration and Usage

The script is generally expected to be initialized once via manual execution,
followed by triggered execution on a daily basis. Additionally, a few helper
functions are provided to help with ongoing visibility of the tool's execution.

### Configuration

There are 3 variables in the code itself that may require modification before
execution:

-   DISTRIBUTION_LIST: an array of strings that includes the email addresses
    that will receive notifications. Mandatory to update.
-   DAILY_TRIGGER_HOUR: the hour of the day that the trigger will run, defaulted
    to 8am. Optional to update.
-   DAILY_TRIGGER_TZ: the time zone that the trigger will run in, defaulted to
    America/New_York. Optional to update.

### Usage

-   Create a new Google Apps Script project. Name it "Google Netblock Monitor".
-   Copy and paste the code from this repository into the Code.gs script.
-   You must modify the DISTRIBUTION_LIST variable. Modifying DAILY_TRIGGER_HOUR
    and DAILY_TRIGGER_TZ is optional.
-   Run the initializeMonitor function. Authorize the required scopes.
-   Validate via Logs that initial values are populated.

## Helpful links

-   [Google Netblock Monitor](https://www.cloudconnect.goog/docs/DOC-33011)
-   [Google IP address ranges for outbound SMTP](https://support.google.com/a/answer/60764)
-   [Overview of Google Apps Script](https://developers.google.com/apps-script/overview)
