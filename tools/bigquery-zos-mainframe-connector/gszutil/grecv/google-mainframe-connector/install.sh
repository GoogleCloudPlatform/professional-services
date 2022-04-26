#!/bin/bash
# run as root
cp -v *.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable mainframe-connector
