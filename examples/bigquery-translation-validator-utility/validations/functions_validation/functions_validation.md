## Function Validation

The Function Validation provides the following functionality :- 

1. Fetch the functions in form of a set from `../../config/functions.csv`.
2. Recursively iterate over the whole SQL and fetch the function names in the set to account for any number of nestings of queries.
3. Compare the count and names of functions encountered and return.