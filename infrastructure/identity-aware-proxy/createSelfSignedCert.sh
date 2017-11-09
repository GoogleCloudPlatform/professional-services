#!/bin/bash

mkdir ssl_cert;
cd ssl_cert;
openssl genrsa -out sample.key 2048;
openssl req -new -key sample.key -out sample.csr;
openssl x509 -req -days 365 -in sample.csr -signkey sample.key -out selfSigned.crt;
