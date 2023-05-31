## Select Only Needed Columns Recommendation

Control projection — Query only the columns that you need. Projection refers to the number of columns that are read by your query.

The Select Only Needed Columns Recommendation does the following :-

1. Extracts all the Selects with projection from the SQL. This includes * and selecting columns from CTE or temporary tables.
2. Creates a list out of this which is latter used in finding the line number.
