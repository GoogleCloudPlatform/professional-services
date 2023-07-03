## ntile_to_approx_quant Recommendation 

This Recommendation does the following :-

1. Running a query that contains the NTILE function can fail with a Resources exceeded error if there are too many elements to ORDER BY in a single partition, which causes data volume to grow
2. This function allows the query to run more efficiently because it doesn't require a global ORDER BY for all rows in the table
3. Extracts all the NTILE keywords present in the query
2. Recommends to use APPROX_QUANTILES instead and reports the line numbers wherever the keyword is present