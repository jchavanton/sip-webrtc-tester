
import {calcMos} from "./mos.js";
import { sendMessage } from "./softphone.js";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

var mos=-1;
// Report: remote-inbound-rtp
var remoteInboundRtp = {jitter: 0, packetsLost:0, packetsLostLast:0, fractionLost:0, 
                        roundTripTime: 0, mos: -1, mosInterval: -1}
// Report: inbound-rtp
var inboundSsrcLast = -1;
var inboundSsrcNew = -1;
var localInboundRtp = {jitter: 0, fractionLost:0, packetsLost:0,
                       packetsLostLast: 0, packetsReceived:0,
                       packetsReceivedLast: 0,
                       mos: -1, mosInterval: -1}
var OutboundRtp = {packetsSent: -1, packetsSentLast: -1, ssrc: -1, lastSsrc: -1, ssrcCount: 0}
var totalSamplesDuration=-1;
var totalSamplesReceived=-1;
var audioLevel=-1;
var totalAudioEnergy=-1;
var removedSamplesForAcceleration=-1;
var concealedSamples=-1;
var jitterBufferDelay=-1;
var jitterBufferEmittedCount=-1;
var packetsDiscarded=-1;
var packetsReceived=-1;
var silentConcealedSamples=-1;
var ssrcCount=0;
var statsJson="";

function updateEstimate(estimate, value) {
    // Exponentially Weighted Moving Average (EWMA)
    const alpha = 0.1;
    estimate = (estimate*(1-alpha)) + (value*alpha);
    console.log(">>>>>>>>>>>>> estimate:"+estimate+" value:"+value +"["+estimate*(1-alpha)+"+"+(value*alpha)+"]");
    return estimate; 
}

export function getMos(){
    if (mos == -1) {
        return 0.0;
    }
    return mos.toFixed(2);
}
export function getSsrcCount(){
    return ssrcCount;
}
export function getTotalSamplesDuration(){
    return totalSamplesDuration.toFixed(2);
}
export function geTotalSamplesReceived(){
    return totalSamplesReceived;
}
export function getSilentConcealedSamples(){
    return silentConcealedSamples;
}
export function getStatsJson(){
    return statsJson;
}
export function getAudioLevel(){
    return audioLevel.toFixed(4);
}
export function getRemovedSamplesForAcceleration(){
    return removedSamplesForAcceleration;
}
export function getConcealedSamples(){
    return concealedSamples;
}
export function getJitterBufferDelay(){
    return jitterBufferDelay;
}
export function getJitterBufferEmittedCount(){
    return jitterBufferEmittedCount;
}
export function getPacketsDiscarded(){
    return packetsDiscarded;
}
export function getPacketsReceived(){
    return packetsReceived;
}
export function  getPacketsReceivedDuration(){
    if (localInboundRtp.packetsReceived == -1) {
        return -1;
    }
    var packetsReceivedDuration = localInboundRtp.packetsReceived/50;
    return packetsReceivedDuration.toFixed(0);
}
export function getTotalAudioEnergy(){
    return totalAudioEnergy.toFixed(4);
}

async function jsonReportFromStats(stats) {
    let includedReports = ["inbound-rtp"];
    let reports = [];
    stats.forEach((report) => {
       if (includedReports.includes(report.type)) reports.push(report);
    });
    statsJson = JSON.stringify(reports, null, 2);
    return statsJson;
}
  

/*
async function getstats(pc) {
    let stats = await pc.getStats();
    let reports = [];
    stats.forEach((report) => {
        reports.push(report);
    });
    return JSON.stringify(reports);  
 }
 
 async function sendMessage(server, content) {
   const target = UserAgent.makeURI("sip:stats@"+server);
   const messager = new Messager(userAgent, target, content);
   messager.message()
 }

 var sdh = Session.sessionDescriptionHandler;
 var pc = sdh.peerConnection;
 var body = getstats(pc);
*/
 

//////////


var statsGatheringOn = false;

export function startStats() {
    console.log(">>> startStats gathering");
    statsGatheringOn = true;
}

export function stopStats() {
    console.log(">>> stopStats gathering");
    statsGatheringOn = false;
}

export async function getStats(pc) {
    while (true) {
      await sleep(5000);
      if (!statsGatheringOn) {
        await console.log(">>> stopping stats gathering");
        break;
      }        
      await console.log(">>>   start  gathering");


      const stats = await pc.getStats();
      const body = await jsonReportFromStats(stats);
      sendMessage('pbx.mango.band',body);
    }
}


  
