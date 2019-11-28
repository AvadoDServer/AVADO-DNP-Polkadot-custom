#!/bin/bash


ls -lR /dev/net/tun

echo "Starting supervisord"
supervisord -c /etc/supervisord.conf

FILE=/zt-data/authtoken.secret
while [ ! -f $FILE ]
do
    echo "waiting for zeroTier to start up ($FILE)"
 
    sleep 2
done

cp $FILE /zt-data/authtoken.secret_
chmod 644 /zt-data/authtoken.secret_

ls -l /zt-data

# start the monitoring webservice
nodejs /usr/monitor/index.js /zt-data/authtoken.secret_ /zt-data

