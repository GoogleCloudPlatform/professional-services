## Join Validation

The Join validation functionality does the following :- 
1. Fetch the joins (inner join, outer join, cross join etc.) and unions from the input and output queries recursively to account for any number of nestings in SQL. 
2. Fetch the Cross joins which are denoted by a comma.
3. Aggregate all the joins and return a dictionary with count of each join for comparison.