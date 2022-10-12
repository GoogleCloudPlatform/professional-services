# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2022-08-20
## Added 
- Dockerized the app, added run scripts for local mode, cloud run mode, and docker mode.

## [1.0.1] - 2022-08-18
### Fixed
- Fixed timestamp to datetime conversion in Views using DATETIME(ts_col,'UTC') instead of CAST(ts as DATETIME)
  - The latter was causing issues when views were querie with time_zone session or global flag set
