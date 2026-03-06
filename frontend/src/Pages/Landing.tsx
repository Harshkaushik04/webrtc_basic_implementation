import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as CustomTypes from "./../types.js"
import axios from "axios";

export function Landing(){
    const usernameRef = useRef<HTMLInputElement|null>(null);
    const roomIDRef = useRef<HTMLInputElement|null>(null);
    const buttonRef = useRef<HTMLButtonElement|null>(null);
    const timerRef = useRef<number|null>(null);
    const Navigate = useNavigate();
    async function clickSubmitButton(){
        if(!buttonRef.current) throw new Error("buttonref.current is null");
        buttonRef.current.disabled=true;
        if(!usernameRef.current) throw new Error("usernameref.current is null");
        if(!roomIDRef.current) throw new Error("roomIDRef.current is null");
        async function sendRequest(){
            const res = await axios.post("/make-user",{
                type:"make-user",
                username:usernameRef.current?.value,
                roomID:roomIDRef.current?.value
            })
            const resData:CustomTypes.makeUserResponseType = res.data;
            if(resData.success){
                if(timerRef.current !==null){
                    clearInterval(timerRef.current);
                }
                Navigate("/MainCall",{
                    state:{
                        username:usernameRef.current?.value,
                        roomID:roomIDRef.current?.value,
                        role:resData.role,
                        targetUsername:resData.targetUsername
                    }
                })
            }
        }
        timerRef.current = setInterval(()=>{
            sendRequest();
        },5000);
        useEffect(()=>{
            return ()=>{
                if(timerRef.current !==null) clearInterval(timerRef.current);
            }
        },[])
    }
    async function clickUnSubmitButton(){
        if(!buttonRef.current) throw new Error("buttonref.current is null");
        if(buttonRef.current.disabled) buttonRef.current.disabled=false;
        if(timerRef.current !== null){
            clearInterval(timerRef.current);
        }
    }
    return (<div>
        <div>username: <input name={"username.."} ref={usernameRef}/></div>
        <div>roomID: <input name={"roomID.."} ref={roomIDRef}/></div>
        <button ref={buttonRef} onClick={clickSubmitButton} disabled={false}>submit</button>
        <button onClick={clickUnSubmitButton}>unsubmit</button>
    </div>)
}