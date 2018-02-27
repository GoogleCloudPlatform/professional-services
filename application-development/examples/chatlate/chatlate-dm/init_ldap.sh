#!/bin/bash
set -x
set -o errexit

# user's password for Spinnaker UI
USER_PASSWORD=$1

mkdir -p /opt/ldap
cd /opt/ldap

add-apt-repository ppa:openjdk-r/ppa -y
apt-get update -y
apt-get install unzip openjdk-8-jre-headless -y
wget  https://github.com/ForgeRock/opendj-community-edition/releases/download/ce%2F2.6.4/OpenDJ-2.6.4.zip
unzip -o OpenDJ-2.6.4.zip
cd opendj


cp -rf template/config config
mkdir -p locks logs
ENCODED_PASSWORD=`bin/encode-password -s SSHA512 -c fraggleb | sed -e 's/.*"\(.*\)"/\1/'`
sed -i "s|userPassword:.*|userPassword: $ENCODED_PASSWORD|" config/config.ldif

bin/stop-ds
bin/start-ds

cat << EOF > file.ldif
dn: dc=example,dc=com
objectclass: top
objectclass: domain
dc: example

dn: ou=users,dc=example,dc=com
objectClass: organizationalUnit
objectClass: top
ou: users

dn: uid=user-1,ou=users,dc=example,dc=com
objectClass: organizationalPerson
objectClass: person
objectClass: inetOrgPerson
objectClass: top
cn: User
sn: Lastname
uid: user-1

dn: ou=groups,dc=example,dc=com
objectClass: organizationalUnit
objectClass: top
ou: groups

dn: cn=goodGuys,ou=groups,dc=example,dc=com
objectClass: groupOfUniqueNames
objectClass: top
cn: goodGuys
uniqueMember: uid=user-1,ou=users
EOF

./bin/ldapmodify --hostName localhost --port 4444 --bindDN cn=Directory\ Manager --bindPassword fraggleb --trustAll --useSSL --noPropertiesFile --defaultAdd  -f file.ldif || true
./bin/ldappasswordmodify  --hostName localhost --port 4444 --bindDN cn=Directory\ Manager --bindPassword fraggleb --trustAll --useSSL --authzID "dn:uid=user-1,ou=users,dc=example,dc=com" --newPassword $USER_PASSWORD
