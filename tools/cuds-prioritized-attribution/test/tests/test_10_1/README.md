Testcase: 10_1
Criteria: All CUDs are in purchases and used in associated projects
Note: (L*) means a label set. Note that "project-1: (L1)" does not mean its a project label.
Its a user label that is attached to a vm thats part of project-1
========


|----COMMITMENTS--|----------BILLING EXPORT-----------------------|----------------------BILLING OUTPUT--------------------------|
|     Purchases   |     Usage          |BA level|BA level|BA level| Expected CUD       |  Expected SUD      |Expected COST       |
| Projects |Amount|                    |  CUD   |  SUD   |  COST  |  allocation        |   allocation       | allocation         |
| ---------|----- |--------------------|-----------------|--------|--------------------|--------------------|--------------------|
|T1:Project-1,    |Project-1(L1):35    |   100  |  20    |  100   |Project-1(L1):25    |Project-1(L1):1.8   |Project-1(L1):25    |
|   Project-2:100 |Project-1(L1,L2):35 |                          |Project-1(L1,L2):25 |Project-1(L1,L2):1.8|Project-1(L1,L2):25 |
|                 |                    |                          |                    |                    |                    |
|                 |Project-2(L2,L1):35 |                          |Project-2(L2,L1):25 |Project-2(L2,L1):1.8|Project-2(L2,L1):25 |
|                 |Project-2(L2):35    |                          |Project-2(L2):25    |Project-2(L2):1.8   |Project-2(L2):25    |
|                 |                    |                          |                    |                    |                    |
|                 |Project-3(L2):70    |                          |Project-3(L2):0     |Project-3(L2):12.72 |Project-3(L2):0     |
|--------------------------------------------------------------------------------------------------------------------------------|

