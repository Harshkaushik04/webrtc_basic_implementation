import { useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as CustomTypes from "./../types.js"
import axios from "axios";
import { WebSocketContext } from "../context/WebSocketContextProvider.js";
import { RTCPeerConnectionContext } from "../context/RTCPeerConnectionContextProvider.js";

export function Landing(){
    const usernameRef = useRef<HTMLInputElement|null>(null);
    const RoomCodeRef = useRef<HTMLInputElement|null>(null);
    const buttonRef = useRef<HTMLButtonElement|null>(null);
    const timerRef = useRef<number|null>(null);
    const ws = useContext<WebSocket|null>(WebSocketContext);
    const myPeerConnection = useContext<RTCPeerConnection|null>(RTCPeerConnectionContext);
    const Navigate = useNavigate();
    async function clickSubmitButton(){
        if(!buttonRef.current) throw new Error("buttonref.current is null");
        buttonRef.current.disabled=true;
        if(!usernameRef.current) throw new Error("usernameref.current is null");
        if(!RoomCodeRef.current) throw new Error("RoomCodeRef.current is null");
        const res = await axios.post("https://webrtc-basic-implementation.onrender.com/make-user",{
            type:"make-user",
            username:usernameRef.current?.value,
            roomCode:RoomCodeRef.current?.value
        })
        const wsMakeUserReq:CustomTypes.wsMakeUserRequestType={
            type:"make-user",
            username:usernameRef.current.value
        }
        if(!ws) console.log("ws is null while clicking button");
        ws?.send(JSON.stringify(wsMakeUserReq));
        const resData:CustomTypes.makeUserResponseType = res.data;
        console.log(resData.success)
        if(resData.success=="yes"){
            if(timerRef.current !==null){
                clearInterval(timerRef.current);
            }
            Navigate("/MainCall",{
                state:{
                    username:usernameRef.current?.value,
                    roomID:RoomCodeRef.current?.value,
                    role:resData.role,
                    targetUsername:resData.targetUsername
                }
            })
        }
    }
    useEffect(()=>{
        return ()=>{
            if(timerRef.current !==null) clearInterval(timerRef.current);
        }
    },[])
    async function clickUnSubmitButton(){
        if(!buttonRef.current) throw new Error("buttonref.current is null");
        if(buttonRef.current.disabled) buttonRef.current.disabled=false;
        if(timerRef.current !== null){
            clearInterval(timerRef.current);
        }
    }
    function reload(){
        if(myPeerConnection) myPeerConnection.close();
        if(ws) ws.close();
        window.location.href="/"
    }
    return (<div>
        <div>username: <input name={"username.."} ref={usernameRef}/></div>
        <div>roomID: <input name={"roomID.."} ref={RoomCodeRef}/></div>
        <button ref={buttonRef} onClick={clickSubmitButton} disabled={false}>submit</button>
        <button onClick={clickUnSubmitButton}>unsubmit</button>
        <div><button onClick={reload}>Reload</button></div>
    </div>)
}