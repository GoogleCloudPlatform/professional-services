Testcase: 3_1
Criteria : More CUDs than purchases
========


|----COMMITMENTS--|----------BILLING EXPORT-----------------|------------------BILLING OUTPUT-------------------|
|     Purchases   |     Usage    |BA level|BA level|BA level| Expected CUD  |  Expected SUD    |Expected COST   |
| Projects |Amount|              |  CUD   |  SUD   | COST   |  allocation   |   allocation     | allocation     |
| ---------|----- |--------------|-----------------|--------|---------------|------------------|----------------|
|T1:Project-1:100 |Project-1: 50 |   200  |  60    |  100   | Project-1: 50 | Project-1: 0     |Project-1: 66.66|
|                 |Project-2:100 |                          | Project-2: 75 | Project-2: 15    |Project-2: 33.33|
|T2:Project-2:50  |Project-3:150 |                          | Project-3: 75 | Project-3: 45    |Project-3: 0    |
|---------------------------------------------------------------------------------------------------------------|

