select
  division,
  sum(sales_amt) sales_amt,
  sum(sales_unit_qty) sales_unit_qty
from `{{ project }}.{{ dataset }}.example_table_2`
where date >= '2019-02-01' and date < '2019-02-14'
group by division