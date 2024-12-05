## Filter Data Before Join

The Filter Data before Join Recommendation does the following :-

1. Finds the Query Structure of the whole SQL. This includes all subqueries in form of an array.
2. For each query in the above array, create a list of `select`, `and`, `where`, `on` and `join` keywords in order.
3. If `and`/`or`/`where` come after a join, this means a filter after join. Identify all such filters
4. Identify the filter statements and line numbers for these and build the recommendation array