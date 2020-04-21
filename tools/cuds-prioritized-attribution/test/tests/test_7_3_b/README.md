Testcase: 7_3
Criteria: Cud COST allocation option 2 (non-default)
Note: (L*) means a label set. Note that "project-1: (L1)" does not mean its a project label.
Its a user label that is attached to a vm thats part of project-1
========


|----COMMITMENTS--|----------BILLING EXPORT-----------------------|----------------------BILLING OUTPUT-----------------------------|
|     Purchases   |     Usage          |BA level|BA level|BA level| Expected CUD      |  Expected SUD        |Expected COST         |
| Projects |Amount|                    |  CUD   |  SUD   | COST   |  allocation       |   allocation         | allocation           |
| ---------|----- |--------------------|-----------------|--------|-------------------|----------------------|----------------------|
|T1:Project-1,    |Project-1(L1):10    |   70  |  0    |  100     |Project-1(L1):10   |Project-1(L1):0       |Project-1(L1):17.5    |
|   Project-2:100 |Project-1(L1,L2):10 |                          |Project-1(L1,L2):10|Project-1(L1,L2):0    |Project-1(L1,L2):17.5 |
|                 |                    |                          |                   |                      |                      |
|                 |Project-2(L2,L1):10 |                          |Project-2(L2,L1):10|Project-2(L2,L1):0    |Project-2(L2,L1):17.5 |
|                 |Project-2(L2):10    |                          |Project-2(L2):10   |Project-2(L2):0       |Project-2(L2):17.5    |
|                 |                    |                          |                   |                      |                      |
|                 |Project-3(L2):15    |                          |Project-3(L2):15   |Project-3(L2):0      |Project-3(L2):15       |
|                 |Project-4(L2):15    |                          |Project-4(L2):15   |Project-3(L2):0      |Project-4(L2):15       |
|-----------------------------------------------------------------------------------------------------------------------------------|

