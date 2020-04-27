Testcase: 9_4
Criteria: More CUDs than purchases
Note: (L*) means a label set. Note that "project-1: (L1)" does not mean its a project label.
Its a user label that is attached to a vm thats part of project-1
========


|----COMMITMENTS--|----------BILLING EXPORT-----------------------|---------------------BILLING OUTPUT-------------------------|
|     Purchases   |     Usage          |BA level|BA level|BA level| Expected CUD      |  Expected SUD      |Expected COST      |
| Projects |Amount|                    |  CUD   |  SUD   | COST   |  allocation       |   allocation       | allocation        |
| ---------|----- |--------------------|-----------------|--------|-------------------|--------------------|-------------------|
|T1:Project-1:50  |Project-1(L1):25    |   100  |  100   |  100   |Project-1(L1):12.5 |Project-1(L1):12.75 |Project-1(L1):12.5 |
|                 |                    |                          |                   |                    |                   |
|T2:Project-2:50  |Project-2(L2,L1):25 |                          |Project-2(L2,L1):25|Project-2(L2,L1):0  |Project-2(L2,L1):50|
|                 |                    |                          |                   |                    |                   |
|                 |Project-1(L1):75    |                          |Project-1(L1):57.5 |Project-1(L1):17.5  |Project-1(L1):37.5 |
|                 |                    |                          |                   |                    |                   |
|                 |Project-3(L2):75    |                          |Project-3(L2):15   |Project-3(L2):60    |Project-3(L2):0    |
|------------------------------------------------------------------------------------------------------------------------------|
