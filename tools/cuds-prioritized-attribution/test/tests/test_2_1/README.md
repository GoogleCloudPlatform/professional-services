Testcase: 2_1
Criteria: More purchases than CUDs with mulitple commitments
========


|----COMMITMENTS--|----------BILLING EXPORT-----------------|------------------BILLING OUTPUT------------------|
|     Purchases   |     Usage    |BA level|BA level|BA level| Expected CUD  |  Expected SUD    |Expected COST  |
| Projects |Amount|              |  CUD   |  SUD   | COST   |  allocation   |   allocation     | allocation    |
| ---------|----- |--------------|-----------------|--------|---------------|------------------|---------------|
|T1:Project-1:100 |Project-1: 50 |   30   |  10    |  100   | Project-1: 15 | Project-1: 1.84  |Project-1:66.66|
|                 |Project-2:100 |                          | Project-2: 15 | Project-2: 4.47  |Project-2:33.33|
|T2:Project-2:50  |Project-3: 70 |                          | Project-3: 0  | Project-3: 3.68  |Project-3: 0   |
|--------------------------------------------------------------------------------------------------------------|
