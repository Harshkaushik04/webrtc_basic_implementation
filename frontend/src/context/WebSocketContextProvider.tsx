import { createContext, useEffect } from "react";
import { useState } from "react";
import type {ReactNode} from "react";

interface Props{
    children:ReactNode;
}
export const webSocketContext=createContext<WebSocket|null>(null);
export function WebSocketContextProvider({children}:Props){
    const [socket,setSocket]=useState<WebSocket|null>(null);
    useEffect(()=>{
        const ws=new WebSocket("ws://localhost:8080");
        setSocket(ws);
        return ()=>{
            socket?.close();
        }
    },[socket])
    return <webSocketContext.Provider value={socket}>
        {children}
    </webSocketContext.Provider>
}