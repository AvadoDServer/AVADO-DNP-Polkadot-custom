#!/bin/bash
echo "Standalone service start"

COMMAND=`cat /zt-data/database.json | jq -r .command`

echo COMMAND=$COMMAND

eval $COMMAND

echo "entering sleep"
sleep infinity
