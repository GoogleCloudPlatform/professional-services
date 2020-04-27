Testcase: 9_2
Criteria: More purchases than CUDs with multiple commitments
Note: (L*) means a label set. Note that "project-1: (L1)" does not mean its a project label.
Its a user label that is attached to a vm thats part of project-1
========


|----COMMITMENTS--|----------BILLING EXPORT-----------------------|----------------------BILLING OUTPUT----------------------------|
|     Purchases   |     Usage          |BA level|BA level|BA level| Expected CUD       |  Expected SUD      |Expected COST         |
| Projects |Amount|                    |  CUD   |  SUD   | COST   |  allocation        |   allocation       | allocation           |
| ---------|----- |--------------------|-----------------|--------|--------------------|--------------------|----------------------|
|T1:Project-1:100 |Project-1(L1):25    |   30  |  20     |  100   |Project-1(L1):7.5   |Project-1(L1):1.8   |Project-1(L1):33.33   |
|                 |Project-1(L1,L2):25 |                          |Project-1(L1,L2):7.5|Project-1(L1,L2):1.8|Project-1(L1,L2):33.33|
|T2:Project-2:50  |                    |                          |                    |                    |                      |
|                 |Project-2(L2,L1):0  |                          |Project-2(L2,L1):7.5|Project-2(L2,L1):4.7|Project-2(L2,L1):16.66|
|                 |Project-2(L2):0     |                          |Project-2(L2):7.5   |Project-2(L2):4.7   |Project-2(L2):16.66   |
|                 |                    |                          |                    |                    |                      |
|                 |Project-2(L2,L1):0  |                          |                    |                    |                      |
|                 |Project-2(L2):0     |                          |                    |                    |                      |
|                 |                    |                          |                    |                    |                      |
|                 |Project-3(L2):35    |                          |Project-3(L2):0     |Project-3(L2):3.68  |Project-3(L2):0       |
|                 |Project-3(L2):35    |                          |Project-3(L2):0     |Project-3(L2):3.68  |Project-3(L2):0       |
|----------------------------------------------------------------------------------------------------------------------------------|
