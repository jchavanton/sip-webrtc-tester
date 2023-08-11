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

import {
  getMos, getStats, startStats, stopStats, getPacketsReceived, getPacketsReceivedDuration,
  getAudioLevel, getTotalAudioEnergy, getRemovedSamplesForAcceleration, getSsrcCount,
  getConcealedSamples, getJitterBufferDelay, getPacketsDiscarded,getSilentConcealedSamples,
  geTotalSamplesReceived, getTotalSamplesDuration, getJitterBufferEmittedCount
} from "./stats.js";

// TODO https://stackoverflow.com/questions/70787567/ice-restart-with-sip-js

var userAgent = null;
var outgoingSession = null;
var iceRestart = 0;

async function setIceRestartHandler(session) {
  var sdh = session.sessionDescriptionHandler;
  sdh.peerConnectionDelegate = {
    oniceconnectionstatechange: (event) => {
        const newState = sdh.peerConnection.iceConnectionState;
        if (newState === 'disconnected') {
          console.log(" >>>>>>>>>>>>>> ICE RESTART <<<<<<<<<<<<<<<<");
            iceRestart++;
            sdh.peerConnection.restartIce();
            sdh.peerConnection.createOffer({'iceRestart': true})
                .then((offer) => {
                    sdh.peerConnection.setLocalDescription(offer);
                    session.sessionDescriptionHandlerModifiersReInvite = [offer];
                    session.invite()
                         .then(() => {
                             session.logger.debug('iceRestart: RE-invite completed');
                         })
                         .catch((error) => {
                             if (error instanceof RequestPendingError) {
                                 session.logger.error('iceRestart: RE-invite is already in progress');
                             }
                             throw error;
                         });
                  });
         }
     }
  };
  console.log(">>>> setIceRestartHandler: done.");
}

 /**
     * Send DTMF via RTP (RFC 4733).
     * Returns true if DTMF send is successful, false otherwise.
     * @param tones - A string containing DTMF digits.
     * @param options - Options object to be used by sendDtmf.
     */
 export function sendDtmf(tones, options) {
    console.log("SessionDescriptionHandler.sendDtmf");
    var sdh = outgoingSession.sessionDescriptionHandler;
    var pc = sdh.peerConnection;
    if (pc === undefined) {
      console.log("SessionDescriptionHandler.sendDtmf failed - peer connection closed");
        return false;
    }
    const senders =  pc.getSenders();
    if (senders.length === 0) {
      console.log("SessionDescriptionHandler.sendDtmf failed - no senders");
        return false;
    }
    const dtmfSender = senders[0].dtmf;
    if (!dtmfSender) {
      console.log("SessionDescriptionHandler.sendDtmf failed - no DTMF sender");
        return false;
    }
    const duration = options === null || options === void 0 ? void 0 : options.duration;
    const interToneGap = options === null || options === void 0 ? void 0 : options.interToneGap;
    try {
        dtmfSender.insertDTMF(tones, duration, interToneGap);
    }
    catch (e) {
      console.log(e.toString());
        return false;
    }
    console.log("SessionDescriptionHandler.sendDtmf sent via RTP: " + tones.toString());
    return true;
}

async function startMedia(Session, mediaElementName) {
    setIceRestartHandler(Session);
    // Assumes you have a media element on the DOM
    const mediaElement = document.getElementById(mediaElementName);
    const remoteStream = new MediaStream();
    var sdh = Session.sessionDescriptionHandler;
    var pc = sdh.peerConnection;
    pc.getReceivers().forEach((receiver) => {
       if (receiver.track) {
           remoteStream.addTrack(receiver.track);
       }
     });
    mediaElement.srcObject = remoteStream;
    mediaElement.play();
    console.log(`#### mediaElement.play`);
    startStats();
    getStats(pc);
}

export function userAgentConnect(server) {
  const transportOptions = {
    server: server,
    keepAliveInterval: 60,
  };
  const userAgentOptions = {
    transportOptions : transportOptions,
    reconnectionAttempts: 4,
    reconnectionDelay: 4
  };
  userAgent = new UserAgent(userAgentOptions);
}

function getQosHearders() {
  stopStats();
  var endTime = Date.now();
  var duration = Math.round((endTime - startTime)/1000);
  var extraHeaders = [
   'X-mos: ' + getMos(),
   'X-audioLevel: ' + getAudioLevel(), // https://docs.w3cub.com/dom/rtcrtpcontributingsource/audiolevel
   'X-totalAudioEnergy: ' + getTotalAudioEnergy(),
   'X-removedSamplesForAcceleration: ' + getRemovedSamplesForAcceleration(),
   'X-jitterBufferDelay: ' +  getJitterBufferDelay(),
   'X-jitterBufferEmittedCount: ' +  getJitterBufferEmittedCount(),
   'X-concealedSamples: ' + getConcealedSamples(),
   'X-silentConcealedSamples: ' + getSilentConcealedSamples(),
   'X-packetsDiscarded: ' + getPacketsDiscarded(),
   'X-totalSamplesReceived: ' + geTotalSamplesReceived(),
   'X-totalSamplesDuration: ' + getTotalSamplesDuration(),
   'X-packetsReceived: ' + getPacketsReceived(),
   'X-packetsReceivedDuration: ' + getPacketsReceivedDuration(),
   'X-duration: ' + duration.toString(),
   'X-iceRestarts: ' + iceRestart,
   'X-ssrcCount:' +getSsrcCount(),
   'X-customerId: 007'
  ];
  return extraHeaders;
}

var startTime = null;

export function userAgentCall(xpin, destination, mediaElementName, connected, disconnected) {
    if (!userAgent) {
        console.log("useragent not connected !");
        return;
    }

    userAgent.start(outgoingSession).then(() => {
    // const target = UserAgent.makeURI("sip:echo@webrtc-gw.connectingpointpro.com");
    const target = UserAgent.makeURI(destination);
  
    var delegate = {
      onBye: (request) => {
        console.log(`>>>> on bye <<<<<`);
	      var extraHeaders = getQosHearders();
        request.accept({ statusCode: 200, extraHeaders});
      }
    }
    var inviterOptions = InviterOptions = {};
    var extraHeaders = [ 'X-pin: ' + xpin ,'X-PBX-IP: 172.31.50.188' ]; //,  'X-DISABLE-FS: true' ]; // , 'X-PBX-IP: 172.31.51.246' ];
    inviterOptions['extraHeaders'] = extraHeaders
    inviterOptions.delegate = delegate;
    const inviter = new Inviter(userAgent, target, inviterOptions);
    inviter.invite();

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
           startTime = Date.now();
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
            //const content = 'Hello World';
            //const target = UserAgent.makeURI("sip:bob@example.com");
            //const messager = new Messager(userAgent, target, content);
            //messager.message();
            var extraHeaders = getQosHearders();
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
