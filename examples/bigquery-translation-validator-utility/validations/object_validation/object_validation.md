## Object Validation

The Object validation functionality does the following :- 
1. Fetch all the tables and views in the SQL query for input and output files recursively to identify objects are `FROM` keyword.
2. Account for objects separated by comma in case of `CROSS JOIN`.
3. Filter the table, view names separated by multiple dot separated strings and return the clean names.