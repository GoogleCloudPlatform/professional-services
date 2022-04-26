openssl genrsa -out server_rsa.key 2048

cat <<'EOF' >server-csr.conf
[req]
default_bits              = 2048
req_extensions            = extension_requirements
distinguished_name        = dn_requirements

[extension_requirements]
basicConstraints          = CA:FALSE
keyUsage                  = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName            = @sans_list

[dn_requirements]
countryName               = Country Name (2 letter code)
stateOrProvinceName       = State or Province Name (full name)
localityName              = Locality Name (eg, city)
0.organizationName        = Organization Name (eg, company)
organizationalUnitName    = Organizational Unit Name (eg, section)
commonName                = Common Name (e.g. server FQDN or YOUR name)
emailAddress              = Email Address

[sans_list]
DNS.1                     = grecv-stunnel

EOF


openssl req -new -sha256 -key server_rsa.key \
    -out server.csr \
    -config server-csr.conf

openssl x509 -req -sha256 \
    -signkey server_rsa.key \
    -in server.csr \
    -out server.cert \
    -days 365  \
    -extensions extension_requirements \
    -extfile server-csr.conf

#remove tmp files
rm server-csr.conf server.csr
