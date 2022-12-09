/*
* Copyright (C) 2015-2021 Twilio, inc.
* 
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
* 
*     http://www.apache.org/licenses/LICENSE-2.0
* 
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

const rfactorConstants = {
    r0: 94.768,
    is: 1.42611
};

/**
 ** Calculate the mos score of a stats object
 * @param {number} rtt
 * @param {number} jitter
 * @param {number} fractionLost - The fraction of packets that have been lost
       Calculated by packetsLost / totalPackets
 * @return {number} mos - Calculated MOS, 1.0 through roughly 4.5
 */
export function calcMos(rtt, jitter, fractionLost) {
    if (!isPositiveNumber(rtt) ||
        !isPositiveNumber(jitter) ||
        !isPositiveNumber(fractionLost)) {
        return null;
    }
    const rFactor = calculateRFactor(rtt, jitter, fractionLost);
    const mos = 1 + (0.035 * rFactor) + (0.000007 * rFactor) * (rFactor - 60) * (100 - rFactor);
    // Make sure MOS is in range
    const isValid = (mos >= 1.0 && mos < 4.6);
    return isValid ? mos : null;
}
  
function calculateRFactor(rtt, jitter, fractionLost) {
    const effectiveLatency = rtt + (jitter * 2) + 10;
    let rFactor = 0;

    switch (true) {
      case effectiveLatency < 160 :
        rFactor = rfactorConstants.r0 - (effectiveLatency / 40);
        break;
      case effectiveLatency < 1000 :
        rFactor = rfactorConstants.r0 - ((effectiveLatency - 120) / 10);
        break;
      case effectiveLatency >= 1000 :
        rFactor = rfactorConstants.r0 - ((effectiveLatency) / 100 );
        break;
    }
  
    let multiplier = .01;
    switch (true) {
      case fractionLost === -1:
        multiplier = 0;
        rFactor = 0;
        break;
      case fractionLost <= (rFactor / 2.5):
        multiplier = 2.5;
        break;
      case fractionLost > (rFactor / 2.5) && fractionLost < 100 :
        multiplier = .25;
        break;
    }
  
    rFactor -= (fractionLost * multiplier);
    return rFactor;
}
  
function isPositiveNumber(n) {
    return typeof n === 'number' && !isNaN(n) && isFinite(n) && n >= 0;
}
