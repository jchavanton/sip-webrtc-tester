/*
 * Copyright (C) 2022 Julien Chavanton <jchavanton@gmail.com>
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA~
 */

import {calcMos} from "./mos.js";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

var mos=0.0;
export function getMos(){
    return mos.toFixed(2);
}
// Report: remote-inbound-rtp
var remoteInboundRtp = {jitter: 0, fractionLost:0, roundTripTime: 0}
// Report: inbound-rtp
var localInboundRtp = {jitter: 0, fractionLost:0}
var InboundRtp = {packetsLost:0, packetsReceived:0}

async function stats(stats) {
    var statsOutput = "";  
    stats.forEach((report) => {
        if (report.type == "inbound-rtp") {
            Object.keys(report).forEach((statName) => {
                if (statName === "jitter") {
                    localInboundRtp.jitter = report[statName];
                    console.log("inbound-rtp jitter:"+ report[statName]);
                } else if (statName === "packetsLost") {
                    InboundRtp.packetsLost = report[statName] - InboundRtp.packetsLost;
                    console.log("inbound-rtp packetsLost:"+ report[statName]);
                } else if (statName === "packetsReceived") {
                    InboundRtp.packetsReceived = report[statName] - InboundRtp.packetsReceived;
                    console.log("inbound-rtp packetsReceived:"+ report[statName]);
                }
            });
            localInboundRtp.fractionLost = InboundRtp.packetsLost/(InboundRtp.packetsReceived+InboundRtp.packetsLost);
        }
        if (report.type == "remote-inbound-rtp") {
            Object.keys(report).forEach((statName) => {
                if (statName === "fractionLost") {
                    remoteInboundRtp.fractionLost = report[statName];
                    console.log("remote-inbound-rtp fractionLost:"+ report[statName]);
                } else if (statName === "jitter") {
                    remoteInboundRtp.jitter = report[statName];
                    console.log("remote-inbound-rtp jitter:"+ report[statName]);
                } else if (statName === "roundTripTime") {
                    remoteInboundRtp.roundTripTime = report[statName];
                    console.log("remote-inbound-rtp roundTripTime:"+ report[statName]);
                }  
            });
        }

      statsOutput += `<h2>Report: ${report.type}</h2>\n<strong>ID:</strong> ${report.id}<br>\n` +
                      `<strong>Timestamp:</strong> ${report.timestamp}<br>\n`;
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
        var mos_tx = calcMos(remoteInboundRtp.roundTripTime, remoteInboundRtp.jitter, remoteInboundRtp.fractionLost);
        var mos_rx = calcMos(remoteInboundRtp.roundTripTime, localInboundRtp.jitter, localInboundRtp.fractionLost);
        mos = (mos_rx+mos_tx)/2;
        console.log("stats interval reached, mos:"+mos.toFixed(2)+" mos_tx:"+mos_tx+" mos_rx:"+mos_rx);
    }
}
  
export async function getStats(pc) {
    for (let i = 0; i < 500; i++) {
      await sleep(5000);
      pc.getStats(null).then(stats);
    }
}
  
