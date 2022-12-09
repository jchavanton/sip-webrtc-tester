#!/bin/bash
DIR=`pwd`
# CONTAINER=webrtc_puppet
docker stop ${CONTAINER}
docker rm ${CONTAINER}
docker run --network=host --shm-size 100M \
 -v /tmp/output:/output \
 -v ${DIR}/test.js:/app/index.js \
 puppeteer:0.0.1
# --name ${CONTAINER} \
 puppeteer:0.0.1
