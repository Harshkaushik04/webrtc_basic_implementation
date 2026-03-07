import { WebSocketContext } from "../context/WebSocketContextProvider";
import { RTCPeerConnectionContext } from "../context/RTCPeerConnectionContextProvider";
import { useContext, useEffect,useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as CustomTypes from "../types.js"

/*
useState() vs useRef() for storing RTCPeerConnection:
since RTCPeerConnection chnages frequently, but we dont want react component to rerender everytime it changes
=>use <useRef>
 */

export function MainCall(){
    const socket = useContext<WebSocket|null>(WebSocketContext);
    const myPeerConnection=useContext<RTCPeerConnection|null>(RTCPeerConnectionContext);
    const receivedVideoRef = useRef<HTMLVideoElement|null>(null);
    const localVideoRef = useRef<HTMLVideoElement|null>(null);
    const hangUpButtonRef = useRef<HTMLButtonElement|null>(null);
    const location = useLocation();
    const state:CustomTypes.landingToMainCallLocationStateType = location.state;
    const username:string = state.username;
    const role:string = state.role;
    const targetUsername:string = state.targetUsername;
    const Navigate = useNavigate();
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
        Navigate("/");
    }

    function handleTrackEvent(event:RTCTrackEvent){
        console.log(`${username}:[handleTrackEvent]`)
        if(!receivedVideoRef.current) throw new Error("receivedVideoRef is null");
        if(!hangUpButtonRef.current) throw new Error("hangUpButtonRef is null");
        if(receivedVideoRef.current.srcObject !==event.streams[0]){
            receivedVideoRef.current.srcObject = event.streams[0];
        }
        receivedVideoRef.current.srcObject=event.streams[0];
        hangUpButtonRef.current.disabled=false;
    }

    function handleIceCandidateEvent(event:RTCPeerConnectionIceEvent){
        console.log(`${username}:[handleIceCandidateEvent]`)
        if(!myPeerConnection) throw new Error("peerConnection is null");
        if(myPeerConnection.iceConnectionState=="closed" || myPeerConnection.iceConnectionState=="failed"){
            closeVideoCall(myPeerConnection);
        }
        if(event.candidate){
            if(!socket) throw new Error("socket is null");
            const send_message:CustomTypes.newIceCandidateType={
                type:"new-ice-candidate",
                target:targetUsername,
                candidate:event.candidate
            }
            socket.send(JSON.stringify(send_message))
        }
    }

    async function handleNegotationNeededEvent(event:Event){
        // "In WebRTC, adding a track automatically fires the onnegotiationneeded event"
        console.log(`${username}:[handleNegotiationNeededEvent]`)
        if(role == "callee") return;
        if(!myPeerConnection) throw new Error("peer connection is null");
        if (myPeerConnection.signalingState !== "stable") {
            console.log("Negotiation already in progress, skipping...");
            return;
        }
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
        if(!myPeerConnection) throw new Error("peerConnection is null");
        const desc:RTCSessionDescription = new RTCSessionDescription(json_message.sdp);
        await myPeerConnection.setRemoteDescription(desc);
    }

    async function handleNewIceCandidate(json_message:CustomTypes.newIceCandidateType){
        if(!myPeerConnection) throw new Error("peerConnection is null");
        const candidate:RTCIceCandidate = new RTCIceCandidate(json_message.candidate);
        try{
            await myPeerConnection.addIceCandidate(candidate);
        }
        catch(e){
            console.log(e);
        }
    }
    useEffect(()=>{ //landing to maincall page rtc caller/callee split
        if(role == "caller"){
            const myPeerConnection:RTCPeerConnection=createPeerConnection();
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
            getUserMedia().then((stream:MediaStream)=>{
                if (!localVideoRef.current) throw new Error("localVideoRef is null");
                localVideoRef.current.srcObject = stream; 
                const tracks:MediaStreamTrack[] = stream.getTracks();
                for(const track of tracks){
                    myPeerConnection.addTrack(track,stream);
                }
            })
        }
    },[])

    useEffect(()=>{ //websockets incoming message handler
        if(!socket) return;
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
        return ()=>{
            socket.onmessage=null;
        }

    },[socket])
    return <>
    <video className="received_video" ref={receivedVideoRef} autoPlay playsInline></video>
    <video className="local_video" ref={localVideoRef} autoPlay playsInline></video>
    <button className="hang-up-button" ref={hangUpButtonRef} disabled={true}></button>
    </>
}