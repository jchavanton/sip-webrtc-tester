#!/bin/bash
git clone https://github.com/alekzonder/docker-puppeteer.git
docker build . -f Dockerfile -t puppeteer:0.0.1

