# Site Verification Group Sync

_syncOwners.py_ is a tool that reads a list of memberships of a Google Group and uses that to populate the list of users that are "Verified Owners" of a domain in the Google Search Console. This is the list of users that are able to create Google Cloud Storage buckets using that domain name. The Google Search Console does not support Google Groups directly.

## Usage

The script can run one time, or be configured as a cron job to keep the two things in sync. Steps to run:

  - Create a service account and download corresponding key
  - Enable "domain-wide delegation" for the service account (in order to read group membership)
  - Ensure the relevant APIs (Admin SDK and Site Verification API) are enabled in the project the service account is created in
  - Update the configuration file with your details
    - Note that the "Admin User" must be a user with permission to read membership of the group
  - Add the service account address to the list of verified owners manually
  - Run script

## Helpful links

  -  https://developers.google.com/site-verification/
  -  https://www.google.com/webmasters/verification/details
