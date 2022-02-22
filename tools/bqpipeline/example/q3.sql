select
  region_nbr,
  category,
  sum(sales_amt) sales_amt,
  sum(sales_unit_qty) sales_unit_qty
from {{ dataset }}.example_table_1
where date >= '2019-02-01' and date < '2019-02-14'
group by region_nbr, category