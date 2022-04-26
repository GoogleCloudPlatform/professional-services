#!/bin/bash
# run as root
cp -v *.service /etc/systemd/system/
chmod 777 /opt/stunnel/var/log
chmod 777 /opt/stunnel/var/run
chmod -R 644 /opt/stunnel/etc/stunnel
systemctl daemon-reload
systemctl enable stunnel
