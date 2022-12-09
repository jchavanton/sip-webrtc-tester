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

import {
    Invitation,
    Inviter,
    InviterOptions,
    Referral,
    Registerer,
    RegistererOptions,
    Session,
    SessionState,
    UserAgent,
    Messager,
    UserAgentOptions,
    OutgoingRequestDelegate,
    OutgoingRequestMessage,
    InvitationAcceptOptions
} from "./sip-0.21.2.js";

import { getMos, getStats } from "./stats.js";

var userAgent = null;
var outgoingSession = null;

async function startMedia(Session, mediaElementName) {
    // Assumes you have a media element on the DOM
    const mediaElement = document.getElementById(mediaElementName);
    const remoteStream = new MediaStream();
    
    Session.sessionDescriptionHandler.peerConnection.getReceivers().forEach((receiver) => {
       if (receiver.track) {
           remoteStream.addTrack(receiver.track);
       }
     });
  
    mediaElement.srcObject = remoteStream;
    mediaElement.play();
    console.log(`#### mediaElement.play`);

    var pc = Session.sessionDescriptionHandler.peerConnection;
    getStats(pc);
}

export function userAgentConnect(server) {
    const transportOptions = {
        server: server
    };
    userAgent = new UserAgent({transportOptions});
}

export function userAgentCall(destination, mediaElementName, connected, disconnected) {
    if (!userAgent) {
        console.log("useragent not connected !");
        return;
    }
    userAgent.start(outgoingSession).then(() => {
    const target = UserAgent.makeURI(destination);
  
    const inviterOptions = InviterOptions = {};
    
    var extraHeaders = [ 'X-Author: Julien Chavanton' ];
    inviterOptions['extraHeaders'] = extraHeaders
    
    const inviter = new Inviter(userAgent, target, inviterOptions);
    inviter.invite();
  
    // An Inviter is a Session
    outgoingSession = inviter;
  
    // Handle outgoing session state changes.
    outgoingSession.stateChange.addListener((SessionState) => {
       console.log(`#### Session state changed >> to ${SessionState}`);
       switch (SessionState) {
         case SessionState.Establishing:
           // Session is establishing.
           break;
         case "Established":
           console.log(`#### setupRemoteMedia.play`);
           // setupRemoteMedia(inviter);
           startMedia(inviter, mediaElementName);
           // Session has been established.
           connected();
           break;
         case SessionState.Terminated:
           cleanupMedia();
           // Session has terminated.
           disconnected();
           break;
         default:
           console.log(`#### unknown`);
           break;
       }
     });
    });
}

export function userAgentDisconnectCall(disconnected) {
    var session = outgoingSession;
    console.log("userAgentDisconnectCall:"+session.state);
    switch(session.state) {
        case SessionState.Initial:
        case SessionState.Establishing:
          if (session instanceof Inviter) {
            // An unestablished outgoing session
            session.cancel();
            disconnected();
          } else {
            // An unestablished incoming session
            session.reject();
            disconnected();
          }
          break;
        case SessionState.Established:
            var extraHeaders = [ 'X-Author: Julien Chavanton' ];
            var options = {
                requestDelegate : {
                    onAccept: (response) => {
                        console.log("bye accepted");
                    },
                    onReject: (response) => {
                        console.log("bye rejected");
                    }
                },
                requestOptions : {
                    'extraHeaders': extraHeaders
                }
            }
            session.bye(options);

          disconnected();
          break;
        case SessionState.Terminating:
        case SessionState.Terminated:
          // Cannot terminate a session that is already terminated
          break;
      }
}
