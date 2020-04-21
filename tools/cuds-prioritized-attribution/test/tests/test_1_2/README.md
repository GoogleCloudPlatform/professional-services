Testcase: 1_2
Criteria : More usage than CUDs
========


|----COMMITMENTS--|----------BILLING EXPORT-----------------|------------------BILLING OUTPUT--------------------|
|     Purchases   |     Usage    |BA level|BA level|BA level| Expected CUD   |  Expected SUD    |Expected COST   |
| Projects |Amount|              |  CUD   |  SUD   | COST   |  allocation    |   allocation     | allocation     |
| ---------|----- |--------------|-----------------|--------|----------------|------------------|----------------|
|T1:Project-1,    |Project-1: 40 |   100  |  40    |  100   | Project-1:36.36| Project-1: 1.32  |Project-1: 36.36|
|   Project-2:100 |Project-2: 70 |                          | Project-2:63.63| Project-2: 2.31  |Project-2: 63.63|
|                 |Project-3: 70 |                          | Project-3: 0   | Project-3: 36.36 |Project-3: 0    |
|----------------------------------------------------------------------------------------------------------------|

