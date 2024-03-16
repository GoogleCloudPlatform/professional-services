#!/bin/bash

# Copyright 2021 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

cat > /etc/systemd/system/workload.service <<MAGICEOF
[Unit] 
Description=Demo Workload 
After=network.target 
StartLimitIntervalSec=0

[Service] 
Type=simple 
Restart=always 
RestartSec=1 
User=root  
ExecStart=/usr/bin/python3 -m http.server

[Install] 
WantedBy=multi-user.target
MAGICEOF

systemctl daemon-reload
systemctl enable workload
systemctl start workload