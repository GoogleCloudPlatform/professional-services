## reduce_to_tmp_tables Recommendation 

This Recommendation does the following :-

1. Extracts all the UNION ALL/DISTINCT keywords present in the query
2. Checks for number of lines present above and below UNION ALL/ DISTINCT keyword
3. If the number of lines above or below crosses 3 then, the utility recommends to define temp tables instead and reports for the line wherever UNION ALL/DISTINCT has been called