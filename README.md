
![raven_rtc](dist/logo_s.jpg)

This repository contains an integration example of SIP.JS.

It does get the WebRTC stats, compute MOS score and send it as an header in the BYE message of every call.


# build locally

`npx webpack`

# test sip.js webrtc with getstats and puppeteer

`file:///<repo dir>/dist/index.html`





Puppetter integration to test the code with an headless chrome is provided as well.

### build docker image with the headless chrome, puppetter and the integration using webpack 
`./build.sh`

### run the puppetter test from a docker container
`./run.sh`
