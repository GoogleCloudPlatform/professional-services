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

## Usage

//TODO(wex): Reference eventual publishing location for guide, currently at the
non-public location:
https://docs.google.com/document/d/1YI8lLNh2Z_piOzg67dtQNw8xVW2mPM79UwnjUhe7reY

The script is generally expected to be initalized once via manual execution,
followed by triggered execution on a daily basis. Additionally, a few helper
functions are provided to help with ongoing visibility of the tool's execution.

There are 3 variables in the code itself that may require modification before
execution:

-   DISTRIBUTION_LIST: an array of strings that includes the email addresses
    that will receive notifications. Mandatory to update.
-   DAILY_TRIGGER_HOUR: the hour of the day that the trigger will run, defaulted
    to 8am. Optional to update.
-   DAILY_TRIGGER_TZ: the time zone that the trigger will run in, defaulted to
    America/New_York. Optional to update.

## Helpful links

-   https://support.google.com/a/answer/60764
-   https://developers.google.com/apps-script/overview
