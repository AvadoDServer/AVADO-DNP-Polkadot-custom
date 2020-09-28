#!/bin/bash
echo "Test service start"

echo "contents of /usr/local/bin"
ls -lR /usr/local/bin

echo "contents of /zt-data"
ls -lR /zt-data

cat /zt-data/database.json

COMMAND=`cat /zt-data/database.json | jq -r .command`

echo COMMAND=---$COMMAND---

ifconfig
ping -c 2 -W 2 10.191.0.1

eval $COMMAND

#/usr/local/bin/polkadot $COMMAND


while :
do
	echo "... ping"
	sleep 5
done
