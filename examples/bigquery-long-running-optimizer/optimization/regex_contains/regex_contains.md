## Use LIKE instead of REGEXP_CONTAINS Recommendation

In BigQuery, you can use the REGEXP_CONTAINS function or the LIKE operator to compare strings. REGEXP_CONTAINS provides more functionality, but also has a slower execution time. Using LIKE instead of REGEXP_CONTAINS is faster, particularly if you don't need the full power of regular expressions that REGEXP_CONTAINS provides, for example wildcard matching.

The Use LIKE instead of REGEXP_CONTAINS Recommendation does the following :-

1. Extracts all the REGEXP_CONTAINS keywords present in the query.
2. Recommends to use LIKE instead and reports the line numbers wherever the keyword is present.
