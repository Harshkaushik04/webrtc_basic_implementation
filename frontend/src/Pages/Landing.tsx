import { useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as CustomTypes from "./../types.js"
import axios from "axios";
import { WebSocketContext } from "../context/WebSocketContextProvider.js";
import { RTCPeerConnectionContext } from "../context/RTCPeerConnectionContextProvider.js";
import type{RTCPeerConnectionContextType} from "../context/RTCPeerConnectionContextProvider.js"

export function Landing(){
    const usernameRef = useRef<HTMLInputElement|null>(null);
    const RoomCodeRef = useRef<HTMLInputElement|null>(null);
    const buttonRef = useRef<HTMLButtonElement|null>(null);
    const timerRef = useRef<number|null>(null);
    const ws = useContext<WebSocket|null>(WebSocketContext);
    const RTCContext = useContext<RTCPeerConnectionContextType|null>(RTCPeerConnectionContext);
    if(!RTCContext) throw new Error("RTCContext is null");
    let myPeerConnections:React.RefObject<Map<string,RTCPeerConnection>> = RTCContext.myPeerConnections;
    const Navigate = useNavigate();
    async function clickSubmitButton(){
        if(!buttonRef.current) throw new Error("buttonref.current is null");
        buttonRef.current.disabled=true;
        if(!usernameRef.current) throw new Error("usernameref.current is null");
        if(!RoomCodeRef.current) throw new Error("RoomCodeRef.current is null");
        const res = await axios.post("https://52.237.88.144:3000/make-user",{
            type:"make-user",
            username:usernameRef.current?.value,
            roomCode:RoomCodeRef.current?.value
        })
        const wsMakeUserReq:CustomTypes.wsMakeUserRequestType={
            type:"make-user",
            username:usernameRef.current.value
        }
        if(!ws) console.log("ws is null while clicking button");
        if(ws?.readyState==ws?.OPEN){
            ws?.send(JSON.stringify(wsMakeUserReq));
            console.log(`[ws]make-user : ws is in open state`)
        }
        else if(ws?.readyState==ws?.CONNECTING){
            ws?.addEventListener('open',()=>{
                ws?.send(JSON.stringify(wsMakeUserReq));
                console.log(`[ws]make-user : ws is in connecting state`)
            },{once:true})
        }
        else{
            console.error("WebSocket is closed. Cannot send user registration.");
        }
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
                    targetUsernames:resData.targetUsernames
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
        for(const [_target_username,myPeerConnection] of myPeerConnections.current){
            myPeerConnection.close();
            myPeerConnections.current.clear();
        }
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