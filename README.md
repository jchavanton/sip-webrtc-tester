This repository contains an integration example of [SIP.JS](https://github.com/onsip/sip.js/) sip over websocket which can be use with [Kamailio](https://www.kamailio.org/docs/modules/devel/modules/websocket.html) for example.

This SIP.js client will also get the [WebRTC stats](https://www.w3.org/TR/webrtc-stats/) , it will also compute MOS score and send it as an header in the BYE message of every call.

A Puppetter integration to test the code with an headless chrome is provided as well.

![image](https://github.com/jchavanton/sip-webrtc-tester/assets/3736014/b2ed9a72-b4a7-4d70-b242-1aaeb92bd26d)


## how-to build locally

`npx webpack`

### test sip.js webrtc with getstats and puppeteer

`file:///<repo dir>/dist/index.html`



## how-to build puppetter integration to test the code with an headless chrome

### build docker image with the headless chrome, puppetter and the integration using webpack 
`./build.sh`

### run the puppetter test from a docker container
`./run.sh`
