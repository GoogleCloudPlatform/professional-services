Testcase: 2_2
Criteria: More purchases then CUDs
========


|----COMMITMENTS--|----------BILLING EXPORT-----------------|------------------BILLING OUTPUT-------------------|
|     Purchases   |     Usage    |BA level|BA level|BA level| Expected CUD  |  Expected SUD    |Expected COST   |
| Projects |Amount|              |  CUD   |  SUD   | COST   |  allocation   |   allocation     | allocation     |
| ---------|----- |--------------|-----------------|--------|---------------|------------------|----------------|
|T1:Project-1,    |Project-1:100 |    60  |  10    |  100   | Project-1: 10 | Project-1: 2.64  |Project-1: 16.66|
|   Project-2:50  |Project-2:200 |                          | Project-2: 20 | Project-2: 5.29  |Project-2: 33.33|
|T2:Project-3:50  |Project-3:100 |                          | Project-3: 30 | Project-3: 2.05  |Project-3: 50   |
|---------------------------------------------------------------------------------------------------------------|

