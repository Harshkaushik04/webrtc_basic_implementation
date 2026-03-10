import { WebSocketContext } from "../context/WebSocketContextProvider";
import { RTCPeerConnectionContext } from "../context/RTCPeerConnectionContextProvider";
import type { RTCPeerConnectionContextType } from "../context/RTCPeerConnectionContextProvider";
import { useContext, useEffect,useRef } from "react";
import { useLocation } from "react-router-dom";
import * as CustomTypes from "../types.js"
import React from "react";
/*
useState() vs useRef() for storing RTCPeerConnection:
since RTCPeerConnection chnages frequently, but we dont want react component to rerender everytime it changes
=>use <useRef>
 */

export function MainCall(){
    const socket = useContext<WebSocket|null>(WebSocketContext);
    const RTCContext=useContext<RTCPeerConnectionContextType|null>(RTCPeerConnectionContext);
    if(!RTCContext) throw new Error("RTCContext is null");
    const myPeerConnections:React.RefObject<Map<string,RTCPeerConnection>> = RTCContext.myPeerConnections;
    const receivedVideoRefs = useRef<Map<string,React.RefObject<HTMLVideoElement|null>>>(new Map<string,React.RefObject<HTMLVideoElement|null>>());
    const localVideoRef = useRef<HTMLVideoElement|null>(null);
    const hangUpButtonRef = useRef<HTMLButtonElement|null>(null);
    const location = useLocation();
    const state:CustomTypes.landingToMainCallLocationStateType = location.state;
    const username:string = state.username;
    const role:string = state.role;
    const targetUsernames:string[] = state.targetUsernames;
    const pendingICECandidates = useRef<Map<string,RTCIceCandidateInit[]>>(new Map<string,RTCIceCandidateInit[]>());
    const [, forceRender] = React.useReducer(x => x + 1, 0);
    function closeVideoCall() {
        if(!receivedVideoRefs.current) throw new Error("receivedVideoRefs is null");
        if(!localVideoRef.current) throw new Error("localVideoRef is null");
        const receivedStreams:Map<string,React.RefObject<HTMLVideoElement|null>> = receivedVideoRefs.current;
        for(const [targetUsername,myPeerConnection] of myPeerConnections.current){
            if (myPeerConnection) {
                myPeerConnection.ontrack = null;
                myPeerConnection.onicecandidate = null;
                myPeerConnection.onnegotiationneeded = null;
                if(receivedStreams.has(targetUsername)){
                    if(!receivedStreams.get(targetUsername)){
                        console.log(`${targetUsername} stream is null in receivedStreams of ${username}`);
                        receivedStreams.delete(targetUsername);
                        continue;
                    }
                    //@ts-ignore
                    const receivedStream:MediaStream = receivedStreams.get(targetUsername).srcObject;
                    if (receivedStream) { // .getTrack() only works on MediaStream
                        receivedStream.getTracks().forEach((track) => track.stop());
                    }
                }
                myPeerConnection.close();
            }
        }
        const localStream = localVideoRef.current.srcObject;
        if (localStream && localStream instanceof MediaStream) { // .getTracks() only works on MediaStream 
            localStream.getTracks().forEach((track) => track.stop());
        }
        if(!hangUpButtonRef.current) throw new Error("hangUpButtonRef is null")
        hangUpButtonRef.current.disabled = true;
        if(socket) socket.close();
        window.location.href="/";
    }

    function handleTrackEvent(event:RTCTrackEvent,targetUsername:string){
        console.log(`${username}:[handleTrackEvent],targetUsername:${targetUsername}`)
        const receivedVideoRef:React.RefObject<HTMLVideoElement|null>|undefined = receivedVideoRefs.current.get(targetUsername);
        if(!receivedVideoRef) {
            console.log(`receivedVideoRef is not in receivedVideoRefs.current for username:${username}, targetUsername:${targetUsername}`);
            return;
        }
        if(!hangUpButtonRef.current) throw new Error("hangUpButtonRef is null");
        if(!receivedVideoRef.current){
            console.log(`receivedVideoRef is null for username:${username}, targetUsername:${targetUsername}`);
            return;
        }
        if(receivedVideoRef.current.srcObject !==event.streams[0]){
            receivedVideoRef.current.srcObject = event.streams[0];
        }
        hangUpButtonRef.current.disabled=false;
    }

    function handleIceCandidateEvent(event:RTCPeerConnectionIceEvent,targetUsername:string){
        console.log(`${username}:[handleIceCandidateEvent] targetUsername:${targetUsername}`)
        const myPeerConnection:RTCPeerConnection|undefined = myPeerConnections.current.get(targetUsername);
        if(!myPeerConnection){
            console.log(`myPeerConnection is null for username:${username} and targetUsername:${targetUsername}`)
            return;
        }
        if(myPeerConnection.iceConnectionState=="closed" || myPeerConnection.iceConnectionState=="failed"){
            closeVideoCall();
        }
        if(event.candidate){
            if(!socket) throw new Error("socket is null");
            const send_message:CustomTypes.outgoingNewIceCandidateType={
                type:"new-ice-candidate-outgoing",
                username:username,
                target:targetUsername,
                candidate:event.candidate
            }
            socket.send(JSON.stringify(send_message))
        }
    }

    async function handleNegotationNeededEvent(_event:Event,targetUsername:string){
        // "In WebRTC, adding a track automatically fires the onnegotiationneeded event"
        console.log(`${username}:[handleNegotiationNeededEvent] targetUsername:${targetUsername}`)
        if(role == "callee") return;
        const myPeerConnection:RTCPeerConnection|undefined = myPeerConnections.current.get(targetUsername);
        if(!myPeerConnection){
            console.log(`myPeerConnection is null for username:${username} and targetUsername:${targetUsername}`)
            return;
        }
        if (myPeerConnection.signalingState !== "stable") {
            console.log("Negotiation already in progress, skipping...");
            return;
        }
        try{
            const offer:RTCSessionDescriptionInit = await myPeerConnection.createOffer();
            await myPeerConnection.setLocalDescription(offer);
            if(!socket) throw new Error("socket is null");
            const json_message:CustomTypes.outgoingVideoOfferType ={
                type:"video-offer-outgoing",
                username:username,
                target:targetUsername,
                sdp:offer
            }
            socket.send(JSON.stringify(json_message));
        }
        catch(e){
            console.log(e);
        }
    }

    function createPeerConnection(targetUsername:string):RTCPeerConnection{
        const myPeerConnection:RTCPeerConnection = new RTCPeerConnection({
            iceServers:[ 
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' }
            ]
        })
        myPeerConnection.ontrack=(event:RTCTrackEvent)=>{
            handleTrackEvent(event,targetUsername);
        }
        myPeerConnection.onicecandidate=(event:RTCPeerConnectionIceEvent)=>{
            handleIceCandidateEvent(event,targetUsername);
        }
        myPeerConnection.onnegotiationneeded=(event:Event)=>{
            handleNegotationNeededEvent(event,targetUsername)
        }
        return myPeerConnection;
    }

    async function handleVideoOffer(json_message:CustomTypes.incomingVideoOfferType){
        console.log(`[handleVideoOffer] username:${username}, targetUsername:${json_message.username}`)
        let targetUsername=json_message.username;
        const myPeerConnection:RTCPeerConnection = createPeerConnection(targetUsername);
        myPeerConnections.current.set(targetUsername,myPeerConnection);
        if(!receivedVideoRefs.current.has(targetUsername)){
            const videoRef = React.createRef<HTMLVideoElement|null>();
            receivedVideoRefs.current.set(targetUsername,videoRef)
            forceRender();
        }
        const desc:RTCSessionDescription = new RTCSessionDescription(json_message.sdp);
        await myPeerConnection.setRemoteDescription(desc);
        const candidates:RTCIceCandidateInit[]|undefined = pendingICECandidates.current.get(targetUsername);
        if(candidates){
            for(const candidate of candidates){
                myPeerConnection.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
            }
            pendingICECandidates.current.set(targetUsername,[]);
        }
        const mediaConstraints = {
            audio:true,
            video:true
        }
        try{
            const localStream:MediaStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
            if(!localVideoRef.current) throw new Error("localVideoRef is null");
            localVideoRef.current.srcObject=localStream;
            const tracks:MediaStreamTrack[] = localStream.getTracks();
            for(const track of tracks){
                myPeerConnection.addTrack(track,localStream);
            }
        }
        catch(e){
            console.log(`error:${e}`);
        }
        const answer_offer:RTCSessionDescriptionInit = await myPeerConnection.createAnswer();
        await myPeerConnection.setLocalDescription(answer_offer);
        if(!socket) throw new Error("socket is null");
        const send_message:CustomTypes.videoAnswerType = {
            type:"video-answer",
            username:username,
            target:targetUsername,
            sdp:answer_offer
        }
        socket.send(JSON.stringify(send_message));
    }

    async function handleVideoAnswer(json_message:CustomTypes.videoAnswerType){
        const targetUsername:string = json_message.username;
        const myPeerConnection:RTCPeerConnection|undefined = myPeerConnections.current.get(targetUsername);
        if(!myPeerConnection){
            console.log(`myPeerConnection is null for username:${username} and targetUsername:${targetUsername}`)
            return;
        }
        if(!myPeerConnection) throw new Error("peerConnection is null");
        const desc:RTCSessionDescription = new RTCSessionDescription(json_message.sdp);
        await myPeerConnection.setRemoteDescription(desc);
        const candidates:RTCIceCandidateInit[]|undefined = pendingICECandidates.current.get(targetUsername);
        if(candidates){
            for(const candidate of candidates){
                await myPeerConnection.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
            }
            pendingICECandidates.current.set(targetUsername,[]);
        }
    }

    async function handleNewIceCandidate(json_message:CustomTypes.incomingNewIceCandidateType){
        const targetUsername:string = json_message.username;
        if(!receivedVideoRefs.current.has(targetUsername)){
            const videoRef = React.createRef<HTMLVideoElement|null>();
            receivedVideoRefs.current.set(targetUsername,videoRef)
            forceRender();
        }
        const myPeerConnection:RTCPeerConnection|undefined = myPeerConnections.current.get(targetUsername);
        if(!myPeerConnection){
            console.log(`myPeerConnection is null for username:${username} and targetUsername:${targetUsername}`)
            return;
        }
        if(!myPeerConnection.remoteDescription){
            const prev:RTCIceCandidateInit[]|undefined = pendingICECandidates.current.get(targetUsername);
            if(prev){
                prev.push(json_message.candidate);
                pendingICECandidates.current.set(targetUsername,prev);
            }
            else{
                pendingICECandidates.current.set(targetUsername,[json_message.candidate])
            }
            return; //will handle these after setting remote description
        }
        try{
            const candidate:RTCIceCandidate = new RTCIceCandidate(json_message.candidate);
            await myPeerConnection.addIceCandidate(candidate);
        }
        catch(e){
            console.log(e);
        }
    }
    useEffect(()=>{ //landing to maincall page rtc caller/callee split
        if(role == "caller"){
            async function getUserMedia(){
                const mediaConstraints = {
                    audio:true,
                    video:true
                }
                let stream:MediaStream = new MediaStream();
                try{
                    stream=await navigator.mediaDevices.getUserMedia(mediaConstraints);
                    return stream;
                }
                catch(e){
                    console.log(`error:${e}`);
                }
                return stream;
            }
            for(const targetUsername of targetUsernames){
                const myPeerConnection:RTCPeerConnection=createPeerConnection(targetUsername);
                myPeerConnections.current.set(targetUsername,myPeerConnection);
                if(!receivedVideoRefs.current.has(targetUsername)){
                    const videoRef = React.createRef<HTMLVideoElement|null>();
                    receivedVideoRefs.current.set(targetUsername,videoRef);
                    forceRender();
                }
                getUserMedia().then((stream:MediaStream)=>{
                    if (!localVideoRef.current) throw new Error("localVideoRef is null");
                    localVideoRef.current.srcObject = stream; 
                    const tracks:MediaStreamTrack[] = stream.getTracks();
                    for(const track of tracks){
                        myPeerConnection.addTrack(track,stream);
                    }
                })
            }
        }
    },[])

    useEffect(()=>{ //websockets incoming message handler
        if(!socket) return;
        socket.onmessage=async (msg:MessageEvent<string>)=>{
            const json_message:CustomTypes.frontendType=JSON.parse(msg.data);
            if(json_message.type=="video-offer-incoming"){
                await handleVideoOffer(json_message);
            }
            else if(json_message.type=="video-answer"){
                await handleVideoAnswer(json_message);
            }
            else if(json_message.type=="new-ice-candidate-incoming"){
                await handleNewIceCandidate(json_message);
            }
        }
        return ()=>{
            socket.onmessage=null;
        }

    },[socket])
    return <>
    {[...receivedVideoRefs.current.entries()].map(([username, ref]) => {
    return <video
      key={username}
      ref={ref}
      autoPlay
      playsInline
    />}
    )}
    <video className="local_video" ref={localVideoRef} autoPlay muted playsInline></video>
    <button className="hang-up-button" ref={hangUpButtonRef} onClick={closeVideoCall}>Hang Up</button>
    </>
}