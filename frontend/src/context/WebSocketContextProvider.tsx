import { createContext, useEffect, useRef } from "react";
import { useState } from "react";
import type {ReactNode} from "react";

interface Props{
    children:ReactNode;
}
export const WebSocketContext=createContext<WebSocket|null>(null);
export function WebSocketContextProvider({children}:Props){
    const [socket,setSocket]=useState<WebSocket|null>(null);
    useEffect(()=>{
        const ws = new WebSocket("wss://package-whatever-surrey-resistance.trycloudflare.com");
        setSocket(ws);
        return ()=>{
            ws.close();
        }
    },[])
    return <WebSocketContext.Provider value={socket}>
        {children}
    </WebSocketContext.Provider>
}