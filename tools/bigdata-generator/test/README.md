
# Test

The purpose of this test is to perform basic validations of the business logic that generates the data based on the predefined rules from the JSON config file:
- Config file is properly parsed
- Number of batches
- Number of rows, number of rows per batch
- Data types generated randomly (datetime, int, strings, uuid, float)

## run

```
source env/bin/activate
python3 test/test.py
```