
import {calcMos} from "./mos.js";

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

async function stats(stats) {
    var statsOutput = "";

    stats.forEach((report) => {
        Object.keys(report).forEach((statName) => {
            if (report.type == "outbound-rtp") {
                if (statName === "ssrc") {
                    if (OutboundRtp.lastSsrc == -1) {
                        OutboundRtp.lastSsrc = report[statName];
                        OutboundRtp.ssrc = report[statName];
                    } else {
                        OutboundRtp.ssrc = report[statName];
                    }
                    console.log("outbound-rtp ssrc: "+ OutboundRtp.ssrc);
             } else if (statName === "packetsSent") {
                    if (OutboundRtp.lastSsrc != OutboundRtp.ssrc) {
                        OutboundRtp.packetsSent += report[statName];
                    } else {
                        OutboundRtp.packetsSent = report[statName];
                    }
                    console.log("outbound-rtp packetsSent: "+ OutboundRtp.packetsSent);
             }
            }
        });

        if (report.type == "inbound-rtp") {
            Object.keys(report).forEach((statName) => {
                console.log(`${statName} : ${report[statName]}`);
                if (statName === "ssrc") {
                    if (inboundSsrcLast == -1) {
                        inboundSsrcLast = report[statName];
                        inboundSsrcNew = report[statName];
                    } else {
                        inboundSsrcNew = report[statName];
                    }
                    console.log("inbound-rtp ssrc: "+ inboundSsrcNew);
                } else if (statName === "jitter") {
                    localInboundRtp.jitter = report[statName];
                    console.log("inbound-rtp jitter: "+ report[statName]);
                } else if (statName === "packetsLost") {
                    if (inboundSsrcLast != inboundSsrcNew) {
                        localInboundRtp.packetsLost += report[statName];
                    } else {
                        localInboundRtp.packetsLost = report[statName];
                    }
                    console.log("inbound-rtp packetsLost: "+ report[statName]);
                } else if (statName === "packetsReceived") {
                    if (inboundSsrcLast != inboundSsrcNew) {
                        localInboundRtp.packetsReceived += report[statName];
                    } else {
                        localInboundRtp.packetsReceived = report[statName];
                    }
                    console.log("inbound-rtp packetsReceived: "+ report[statName]);
                    console.log("inbound-rtp packetsReceivedDuration: "+ getPacketsReceivedDuration());
                } else if (statName === "silentConcealedSamples") {
                    if (inboundSsrcLast != inboundSsrcNew) {
                        silentConcealedSamples += report[statName];
                    } else {
                        silentConcealedSamples = report[statName];
                    }
                    console.log("inbound-rtp silentConcealedSamples: "+ report[statName]);
                } else if (statName === "totalSamplesDuration") {
                    if (inboundSsrcLast != inboundSsrcNew) {
                        totalSamplesDuration += report[statName];
                    } else {
                        totalSamplesDuration = report[statName];
                    }
                    console.log("inbound-rtp totalSamplesDuration: "+ report[statName]);
                } else if (statName === "totalSamplesReceived") {
                    if (inboundSsrcLast != inboundSsrcNew) {
                        totalSamplesReceived += report[statName];
                    } else {
                        totalSamplesReceived = report[statName];
                    }
                    console.log("inbound-rtp totalSamplesReceived: "+ report[statName]);
                } else if (statName === "audioLevel") {
                    if (audioLevel == -1) {
                        audioLevel = report[statName];
                    } else {
                        audioLevel = updateEstimate(audioLevel ,report[statName]);
                    }
                    console.log("inbound-rtp getAudioLevel: "+ report[statName]);
                } else if (statName === "removedSamplesForAcceleration") {
                    removedSamplesForAcceleration = report[statName];
                    console.log("inbound-rtp removedSamplesForAcceleration: "+ report[statName]);
                } else if (statName === "totalSamplesReceived") {
                    totalSamplesReceived = report[statName];
                    console.log("inbound-rtp totalSamplesReceived: "+ report[statName]);
                } else if (statName === "concealedSamples") {
                    concealedSamples = report[statName];
                    console.log("inbound-rtp concealedSamples: "+ report[statName]);
                } else if (statName === "jitterBufferDelay") {
                    jitterBufferDelay = report[statName];
                    console.log("inbound-rtp jitterBufferDelay: "+ report[statName]);
                } else if (statName === "jitterBufferEmittedCount") {
                    jitterBufferEmittedCount = report[statName];
                    console.log("inbound-rtp jitterBufferEmittedCount: "+ report[statName]);
                } else if (statName === "packetsDiscarded") {
                    packetsDiscarded = report[statName];
                    console.log("inbound-rtp packetsDiscarded: "+ report[statName]);
                } else if (statName === "totalAudioEnergy") {
                    totalAudioEnergy = report[statName];
                    console.log("inbound-rtp totalAudioEnergy: "+ report[statName]);
                }
            });
            localInboundRtp.fractionLost = localInboundRtp.packetsLost/(localInboundRtp.packetsReceived+localInboundRtp.packetsLost);
            remoteInboundRtp.fractionLost = remoteInboundRtp.packetsLost/OutboundRtp.packetsSent;
            console.log(">>> packetsReceivedDuration: " + getPacketsReceivedDuration() +" totalSamplesDuration: "+ getTotalSamplesDuration());
        }

        if (report.type == "remote-inbound-rtp") {
            Object.keys(report).forEach((statName) => {
                if (statName === "fractionLost") {
                    console.log("remote-inbound-rtp fractionLost: "+ report[statName]);
                } else if (statName === "packetsLost") {
                    remoteInboundRtp.packetsLost = report[statName];
                    console.log("remote-inbound-rtp packetsLost: "+ report[statName]);
                } else if (statName === "jitter") {
                    remoteInboundRtp.jitter = report[statName];
                    console.log("remote-inbound-rtp jitter: "+ report[statName]);
                } else if (statName === "roundTripTime") {
                    remoteInboundRtp.roundTripTime = report[statName];
                    console.log("remote-inbound-rtp roundTripTime: "+ report[statName]);
                } 
            });
        }

        statsOutput += `<h2>Report: ${report.type}</h2>\n<strong>ID:</strong> ${report.id}<br>\n` +
                      `<strong>Timestamp:</strong> ${report.timestamp}<br>\n`;

        if (inboundSsrcLast != inboundSsrcNew) {
            console.log(">>>>>> Inbound RTP NEW SSRC ["+inboundSsrcLast+"]>["+inboundSsrcNew+"] count ["+ssrcCount+"] <<<<<<");
            ssrcCount++;
            inboundSsrcLast = inboundSsrcNew;
        }

        if (OutboundRtp.lastSsrc != OutboundRtp.ssrc) {
            console.log(">>>>>> Outbound RTP NEW SSRC ["+OutboundRtp.lastSsrc+"]>["+OutboundRtp.ssrc+"] count ["+OutboundRtp.ssrcCount+"] <<<<<<");
            OutboundRtp.lastSsrc = OutboundRtp.ssrc;
            OutboundRtp.ssrcCount++;
        }
        OutboundRtp.lastSsrc

        // Now the statistics for this report; we intentionally drop the ones we
        // sorted to the top above
        Object.keys(report).forEach((statName) => {
         if (statName !== "id" && statName !== "timestamp" && statName !== "type") {
           statsOutput += `<strong>${statName}:</strong> ${report[statName]}<br>\n`;
        }
       });
     });
     document.querySelector(".stats-box").innerHTML = statsOutput;
     if (remoteInboundRtp.roundTripTime > 0) {
        // global Mos Tx/Rx
        if (remoteInboundRtp.fractionLost >= 0 && remoteInboundRtp.jitter >= 0) {
            remoteInboundRtp.mos = calcMos(remoteInboundRtp.roundTripTime, remoteInboundRtp.jitter*1000, remoteInboundRtp.fractionLost*100);
        }
        if (localInboundRtp.fractionLost >= 0 && localInboundRtp.jitter >= 0) {
            localInboundRtp.mos = calcMos(remoteInboundRtp.roundTripTime, localInboundRtp.jitter*1000, localInboundRtp.fractionLost*100);
        }
        var fractionLost=-1.0;

        // interval Tx
        if (remoteInboundRtp.mosInterval == -1) {
            remoteInboundRtp.mosInterval = remoteInboundRtp.mos;
        } else {
            var packetSentInterval = OutboundRtp.packetsSent - OutboundRtp.packetsSentLast;
            var packetLostInterval = remoteInboundRtp.packetsLost - remoteInboundRtp.packetsLostLast;
            if (packetSentInterval > 0 && packetLostInterval >= 0) {
                fractionLost = ((packetLostInterval)/packetSentInterval)*100;
                console.log("Tx fractionLost["+fractionLost+"]lost["+ remoteInboundRtp.packetsLost +"]last["+remoteInboundRtp.packetsLostLast+"]pkt["+packetSentInterval+"]");
            } else {
                fractionLost=0;
            }
            remoteInboundRtp.mosInterval = calcMos(remoteInboundRtp.roundTripTime, remoteInboundRtp.jitter*1000, fractionLost);
        }
        remoteInboundRtp.packetsLostLast = remoteInboundRtp.packetsLost;
        OutboundRtp.packetsSentLast = OutboundRtp.packetsSent;
        console.log(">>> stats interval reached, interval Tx mos: "+remoteInboundRtp.mosInterval.toFixed(2)+" pkts:"+packetSentInterval+" lost:"+fractionLost+" jitter:"+remoteInboundRtp.jitter); 

        fractionLost=-1;

        // interval Rx
        if (localInboundRtp.mosInterval == -1) {
            localInboundRtp.mosInterval = localInboundRtp.mos;
        } else {
            var packetReceivedInterval = localInboundRtp.packetsReceived - localInboundRtp.packetsReceivedLast;
            var packetsLostInterval = localInboundRtp.packetsLost - localInboundRtp.packetsLostLast;
            var packetsTotalInterval = packetReceivedInterval+packetsLostInterval;
            if (packetsTotalInterval > 0 && packetsLostInterval >= 0) {
                fractionLost = ((localInboundRtp.packetsLost-localInboundRtp.packetsLostLast)/packetsTotalInterval)*100;
                console.log("Rx fractionLost["+fractionLost+"]lost["+ localInboundRtp.packetsLost +"]last["+localInboundRtp.packetsLostLast+"]pkt["+packetReceivedInterval+"]");
            } else {
                fractionLost = 0;
            }
            localInboundRtp.mosInterval = calcMos(remoteInboundRtp.roundTripTime, localInboundRtp.jitter*1000, fractionLost);

        }
        localInboundRtp.packetsLostLast = localInboundRtp.packetsLost;
        localInboundRtp.packetsReceivedLast = localInboundRtp.packetsReceived;
        console.log(">>> stats interval reached, interval Rx mos: "+localInboundRtp.mosInterval.toFixed(2)+" pkts:"+packetsTotalInterval+" lost:"+fractionLost+" jitter:"+ localInboundRtp.jitter); 

        // Global Mos average
        if (remoteInboundRtp.mos && localInboundRtp.mos) {
            if (mos == -1) {
                mos = (remoteInboundRtp.mos+localInboundRtp.mos)/2;
            } else {
                mos = updateEstimate(mos, (remoteInboundRtp.mos+localInboundRtp.mos)/2);
            }
            console.log(">>> stats interval reached, mos:"+mos.toFixed(2)+" mos_tx:"+remoteInboundRtp.mos.toFixed(2)+" mos_rx:"+localInboundRtp.mos.toFixed(2));
        }
    }
}

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
      pc.getStats(null).then(stats);
    }
}
  
