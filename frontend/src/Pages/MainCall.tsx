import { webSocketContext } from "../context/WebSocketContextProvider";
import { RTCPeerConnectionContext } from "../context/RTCPeerConnectionContextProvider";
import { useContext, useEffect,useRef } from "react";
import { useLocation } from "react-router-dom";
import * as CustomTypes from "../types"

/*
useState() vs useRef() for storing RTCPeerConnection:
since RTCPeerConnection chnages frequently, but we dont want react component to rerender everytime it changes
=>use <useRef>
 */

export function MainCall(){
    const socket = useContext<WebSocket|null>(webSocketContext);
    const receivedVideoRef = useRef<HTMLVideoElement|null>(null);
    const localVideoRef = useRef<HTMLVideoElement|null>(null);
    const hangUpButtonRef = useRef<HTMLButtonElement|null>(null);
    const location = useLocation();
    const {username,roomId,targetUsername,peerConnection} = location.state;
    function closeVideoCall(myPeerConnection:RTCPeerConnection) {
        if(!receivedVideoRef.current) throw new Error("receivedVideoRef is null");
        if(!localVideoRef.current) throw new Error("localVideoRef is null");
        const receivedStream = receivedVideoRef.current.srcObject;
        const localStream = localVideoRef.current.srcObject;

        if (myPeerConnection) {
            myPeerConnection.ontrack = null;
            myPeerConnection.onicecandidate = null;
            myPeerConnection.onnegotiationneeded = null;

            if (receivedStream && receivedStream instanceof MediaStream) { // .getTrack() only works on MediaStream
                receivedStream.getTracks().forEach((track) => track.stop());
            }

            if (localStream && localStream instanceof MediaStream) { // .getTracks() only works on MediaStream 
                localStream.getTracks().forEach((track) => track.stop());
            }

            myPeerConnection.close();
        }
        if(!hangUpButtonRef.current) throw new Error("hangUpButtonRef is null")
        hangUpButtonRef.current.disabled = true;
    }

    function handleTrackEvent(event:RTCTrackEvent){
        if(!receivedVideoRef.current) throw new Error("receivedVideoRef is null");
        if(!hangUpButtonRef.current) throw new Error("hangUpButtonRef is null");
        receivedVideoRef.current.srcObject=event.streams[0];
        hangUpButtonRef.current.disabled=false;
    }

    function handleIceCandidateEvent(event:RTCPeerConnectionIceEvent){
        const myPeerConnection = event.target as RTCPeerConnection;
        if(myPeerConnection.iceConnectionState=="closed" || myPeerConnection.iceConnectionState=="failed"){
            closeVideoCall(myPeerConnection);
        }
    }

    async function handleNegotationNeededEvent(event:Event){
        const myPeerConnection = event.target as RTCPeerConnection;
        try{
            const offer:RTCSessionDescriptionInit = await myPeerConnection.createOffer();
            await myPeerConnection.setLocalDescription(offer);
            if(!socket) throw new Error("socket is null");
            const json_message:CustomTypes.videoOfferType ={
                type:"video-offer",
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

    function createPeerConnection():RTCPeerConnection{
        const myPeerConnection=useContext<RTCPeerConnection|null>(RTCPeerConnectionContext);
        if(!myPeerConnection) throw new Error("peerConnection is null");
        myPeerConnection.ontrack=handleTrackEvent;
        myPeerConnection.onicecandidate=handleIceCandidateEvent;
        myPeerConnection.onnegotiationneeded=handleNegotationNeededEvent;
        return myPeerConnection;
    }

    async function handleVideoOffer(json_message:CustomTypes.videoOfferType){
        const myPeerConnection:RTCPeerConnection = createPeerConnection();
        const desc:RTCSessionDescription = new RTCSessionDescription(json_message.sdp);
        await myPeerConnection.setRemoteDescription(desc);
        const mediaConstraints = {
            audio:true,
            video:true
        }
        const localStream:MediaStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
        if(!localVideoRef.current) throw new Error("localVideoRef is null");
        localVideoRef.current.srcObject=localStream;
        const tracks:MediaStreamTrack[] = localStream.getTracks();
        for(const track of tracks){
            myPeerConnection.addTrack(track,localStream);
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
        const myPeerConnection = useContext<RTCPeerConnection|null>(RTCPeerConnectionContext);
        if(!myPeerConnection) throw new Error("peerConnection is null");
        const desc:RTCSessionDescription = new RTCSessionDescription(json_message.sdp);
        await myPeerConnection.setRemoteDescription(desc);
    }

    async function handleNewIceCandidate(json_message:CustomTypes.newIceCandidateType){
        const myPeerConnection = useContext<RTCPeerConnection|null>(RTCPeerConnectionContext);
        if(!myPeerConnection) throw new Error("peerConnection is null");
        const candidate:RTCIceCandidate = new RTCIceCandidate(json_message.candidate);
        try{
            await myPeerConnection.addIceCandidate(candidate);
        }
        catch(e){
            console.log(e);
        }
    }
    useEffect(()=>{
        if(socket && socket.readyState==WebSocket.OPEN){
            socket.onmessage=async (msg:MessageEvent<string>)=>{
                const json_message:CustomTypes.frontendType=JSON.parse(msg.data);
                if(json_message.type=="video-offer"){
                    await handleVideoOffer(json_message);
                }
                else if(json_message.type=="video-answer"){
                    await handleVideoAnswer(json_message);
                }
                else if(json_message.type=="new-ice-candidate"){
                    await handleNewIceCandidate(json_message);
                }
            }
        }
    },[])
    return <>
    <video className="received_video" ref={receivedVideoRef} autoPlay={true}></video>
    <video className="local_video" ref={localVideoRef} autoPlay={true} muted={true}></video>
    <button className="hang-up-button" ref={hangUpButtonRef} disabled={true}></button>
    </>
}