Testcase: 6_5
Criteria : All CUDs are in purchases and used in associated projects. Multiple commitments with different commit dates in overlapping projects with usage.
========


|----COMMITMENTS--|----------BILLING EXPORT-----------------|------------------BILLING OUTPUT----------------|
|     Purchases   |     Usage    |BA level|BA level|BA level| Expected CUD  |  Expected SUD    |Expected COST|
| Projects |Amount|              |  CUD   |  SUD   | COST   |  allocation   |   allocation     | allocation  |
| ---------|----- |--------------|-----------------|--------|---------------|------------------|-------------|
|T1:Project-1,    |Project-1: 70 |   100  |  40    |  100   | Project-1: 50 | Project-1: 7.27  |Project-1: 50|
|   Project-2:100 |Project-2: 70 |                          | Project-2: 50 | Project-2: 7.27  |Project-2: 50|
|                 |Project-3: 70 |                          | Project-3: 0  | Project-3: 25.45 |Project-3: 0 |
|                 |              |                          |               |                  |             |
|T2:Project-2,    |Project-2: 70 |   100  |  40             | Project-2: 50 | Project-2: 7.27  |Project-2: 50|
|   Project-3:100 |Project-3: 70 |                          | Project-3: 50 | Project-3: 7.27  |Project-3: 50|
|                 |Project-1: 70 |                          | Project-1: 0  | Project-1: 25.45 |Project-1: 0 |
|------------------------------------------------------------------------------------------------------------|

