Testcase: 6_2
Criteria : More CUDs than purchases.
========

Folder-1 --> Project-1
Folder-2 --> Project-2
Folder-3 --> Project-3

|----commitments--|----------BILLING EXPORT-----------------|------------------BILLING OUTPUT--------------|
|     Purchases   |     Usage    |BA level|BA level|BA level| Expected CUD  |  Expected SUD |Expected COST |
| Projects |Amount|              |  CUD   |  SUD   | COST   |  allocation   |   allocation  | allocation   |
| ---------|----- |--------------|-----------------|--------|---------------|---------------|--------------|
|T1:Folder-1: 50  |Project-1: 100|   100  |  40    |  100   | Project-1: 60 | Project-1: 8  |Project-1: 100|
|                 |Project-2: 200|                          | Project-2: 40 | Project-2: 32 |Project-2: 0  |
|                 |Project-3: 0  |                          | Project-3: 0  | Project-3: 0  |Project-3: 0  |
|----------------------------------------------------------------------------------------------------------|

