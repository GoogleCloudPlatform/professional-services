Testcase: 4_1
Criteria: All CUDs are in purchases and used in associated projects in folders
========

Folder-1 --> Project-1
Folder-2 --> Project-2
Folder-3 --> Project-3

|----COMMITMENTS--|----------BILLING EXPORT-----------------|------------------BILLING OUTPUT----------------|
|     Purchases   |     Usage    |BA level|BA level|BA level| Expected CUD  |  Expected SUD    |Expected COST|
| Folders  |Amount|              |  CUD   |  SUD   | COST   |  allocation   |   allocation     | allocation  |
| ---------|----- |--------------|-----------------|--------|---------------|------------------|-------------|
|T1:Folder-1,     |Project-1: 70 |   100  |  40    |  100   | Project-1: 50 | Project-1: 7.27  |Project-1: 50|
|   Folder-2:100  |Project-2: 70 |                          | Project-2: 50 | Project-2: 7.27  |Project-2: 50|
|                 |Project-3: 70 |                          | Project-3: 0  | Project-3: 25.45 |Project-3: 0 |
|------------------------------------------------------------------------------------------------------------|

