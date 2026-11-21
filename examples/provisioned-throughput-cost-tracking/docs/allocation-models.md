# Choosing how to share the cost

Provisioned Throughput has two parts on the invoice:

- **A fixed fee** for the reserved capacity, charged whether or not you use it. Labels on requests do not apply to it, so you split it yourself.
- **Overflow usage**, which is traffic above the reservation. It is billed at pay-as-you-go prices and keeps the request labels, so the billing export already shows each team's share.

Agree one of these models with the teams before the first month, and write it down.

## 1. By actual use

Each team pays the fixed fee in proportion to its share of the reserved capacity it used that month.

```
team share of fixed fee = fixed fee x (team burndown tokens / all burndown tokens)
```

- **Good for:** teams with changing workloads, and a first showback report.
- **Things to consider:** a team's bill changes when another team's usage changes. Idle capacity is shared by whoever used the rest.
- **Query:** [`sql/monthly_allocation.sql`](../sql/monthly_allocation.sql).

"Burndown tokens" are the `ptChargedInputTokenCount` and `ptChargedOutputTokenCount` values that the metadata log records on every request served from reserved capacity. They already reflect how fast each kind of token uses up the reservation, so they are a fair basis for the fixed fee. They are not a basis for overflow usage, which has its own prices per model and token type. Use the billing export for overflow usage.

## 2. By an agreed ratio

Teams agree a fixed split (for example 60/40), usually based on the capacity each team asked for when the order was sized.

- **Good for:** stable workloads and simple budgeting. Each team knows its cost in advance.
- **Things to consider:** review the ratio each quarter against the metadata log so it stays fair.

## 3. Baseline plus overflow

Each team commits to a baseline share of the reservation and pays that share of the fixed fee. Overflow usage is charged at actual cost from the billing export.

- **Good for:** larger organizations with a central platform team.
- **Things to consider:** it needs a quota or gateway so one team cannot use another team's baseline. See [api-gateway-pattern.md](api-gateway-pattern.md).

## Unused capacity

Decide who pays for capacity no team used. Common choices are to share it by use, share it by the agreed ratio, or have the platform team carry it as a cost of providing the service.

## Worked example (illustrative figures)

Fixed fee: \$10,000 a month. Burndown tokens: Team A 600M, Team B 400M.

| Team | Burndown tokens | Share of fixed fee | Overflow usage cost (billing export) | Total |
|---|---|---|---|---|
| Team A | 600M (60%) | \$6,000 | \$350 | \$6,350 |
| Team B | 400M (40%) | \$4,000 | \$900 | \$4,900 |
