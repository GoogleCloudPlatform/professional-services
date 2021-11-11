Testcase: 10_2
Criteria: SpillOver
Note: (L*) means a label set. Note that "project-1: (L1)" does not mean its a project label.
Its a user label that is attached to a vm thats part of project-1
========


|----COMMITMENTS--|----------BILLING EXPORT-----------------------|----------------------BILLING OUTPUT--------------------------|
|     Purchases   |     Usage          |BA level|BA level|BA level| Expected CUD       |  Expected SUD      |Expected COST       |
| Projects |Amount|                    |  CUD   |  SUD   |  COST  |  allocation        |   allocation       | allocation         |
| ---------|----- |--------------------|-----------------|--------|--------------------|--------------------|--------------------|
|T1:Project-1,    |Project-1(L1):20    |   100  |  20    |  100   |Project-1(L1):20    |Project-1(L1):0     |Project-1(L1):25    |
|   Project-2:100 |Project-1(L1,L2):20 |                          |Project-1(L1,L2):20 |Project-1(L1,L2):0  |Project-1(L1,L2):25 |
|                 |                    |                          |                    |                    |                    |
|                 |Project-2(L2,L1):20 |                          |Project-2(L2,L1):20 |Project-2(L2,L1):0  |Project-2(L2,L1):25 |
|                 |Project-2(L2):20    |                          |Project-2(L2):20    |Project-2(L2):0     |Project-2(L2):25    |
|                 |                    |                          |                    |                    |                    |
|                 |Project-3(L2):35    |                          |Project-3(L2):10    |Project-3(L2):10    |Project-3(L2):0     |
|                 |Project-4(L2):35    |                          |Project-3(L2):10    |Project-3(L2):10    |Project-3(L2):0     |
|--------------------------------------------------------------------------------------------------------------------------------|

